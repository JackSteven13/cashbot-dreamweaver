import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useSessionStats } from './useSessionStats';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import balanceManager from '@/utils/balance/balanceManager';
import { createMoneyParticles } from '@/utils/animations';

const useDashboardSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert,
  resetBalance
}) => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [revenueGenerated, setRevenueGenerated] = useState(0);
  const [lastSessionTimestamp, setLastSessionTimestamp] = useState(0);
  const [isBotActive, setIsBotActive] = useState(true); // TOUJOURS ACTIF
  
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const referralCount = userData?.referrals?.length || 0;
  const balanceDisplayRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    const balanceElement = document.querySelector('.balance-display') as HTMLElement;
    if (balanceElement) {
      balanceDisplayRef.current = balanceElement;
    }
  }, []);
  
  const { 
    addSessionResult, 
    sessionCount, 
    todaysGainRef, 
    activityLevel
  } = useSessionStats(userData?.subscription);
  
  useEffect(() => {
    if (!isBotActive) {
      setIsBotActive(true);
      console.log("Bot réactivé automatiquement");
    }
    
    const forceActiveInterval = setInterval(() => {
      if (!isBotActive) {
        setIsBotActive(true);
        window.dispatchEvent(new CustomEvent('bot:status-change', { 
          detail: { active: true } 
        }));
      }
    }, 5000);
    
    return () => clearInterval(forceActiveInterval);
  }, [isBotActive]);
  
  const handleStartSession = useCallback(async () => {
    if (isStartingSession || !userData) {
      toast({
        title: "Session en cours",
        description: "Veuillez attendre la fin de l'analyse en cours.",
        duration: 3000
      });
      return;
    }
    
    try {
      setIsStartingSession(true);
      
      const terminalAnimation = createBackgroundTerminalSequence([
        "Initialisation de l'analyse...",
        "Récupération des données..."
      ]);
      
      const startTime = Date.now();
      setLastSessionTimestamp(startTime);
      
      const processingTime = Math.random() * 1000 + 1500;
      await new Promise(resolve => {
        sessionTimeoutRef.current = setTimeout(resolve, processingTime);
      });
      
      terminalAnimation.add("Analyse des contenus publicitaires...");
      
      const subscription = userData.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription] || 0.5;
      
      const todaysGains = balanceManager.getDailyGains();
      const remainingToLimit = Math.max(0, dailyLimit - todaysGains);
      
      let gain = 0;
      
      if (remainingToLimit > 0) {
        const baseGain = subscription === 'freemium' ? 0.05 : 0.1;
        const randomFactor = 0.8 + (Math.random() * 0.4);
        
        gain = Math.min(
          remainingToLimit,
          baseGain * randomFactor * (1 + referralCount * 0.05)
        );
        
        gain = Math.round(gain * 100) / 100;
      } else {
        setShowLimitAlert(true);
        gain = Math.min(0.01, remainingToLimit);
      }
      
      terminalAnimation.add(`Analyse terminée! Gain calculé: ${gain.toFixed(2)}€`);
      
      const oldBalance = balanceManager.getCurrentBalance();
      
      balanceManager.addDailyGain(gain);
      balanceManager.updateBalance(gain);
      
      if (balanceDisplayRef.current) {
        createMoneyParticles(balanceDisplayRef.current, Math.min(15, Math.ceil(gain * 20)));
      }
      
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          oldBalance: oldBalance,
          newBalance: oldBalance + gain,
          animate: true
        }
      }));
      
      const sessionReport = `Session manuelle #${dailySessionCount + 1}: ${gain}€`;
      
      addSessionResult(gain);
      
      await updateBalance(gain, sessionReport);
      
      await incrementSessionCount();
      
      toast({
        title: "Session terminée",
        description: `${gain.toFixed(2)}€ ont été ajoutés à votre solde.`,
        duration: 3000,
      });
      
      setRevenueGenerated(gain);
      
      terminalAnimation.complete(gain);
      
      window.dispatchEvent(new CustomEvent('dashboard:activity', { 
        detail: { level: 'high' } 
      }));
      
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('dashboard:micro-gain', { 
            detail: { amount: gain / 3, timestamp: Date.now(), animate: true } 
          }));
        }, 1000 + i * 800);
      }
      
      const sessionDuration = Date.now() - startTime;
      console.log(`Session completed in ${sessionDuration}ms with gain ${gain}€`);
      
    } catch (error) {
      console.error("Error during session:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant l'analyse",
        variant: "destructive",
      });
    } finally {
      setIsStartingSession(false);
    }
  }, [
    isStartingSession, 
    userData, 
    dailySessionCount, 
    updateBalance, 
    incrementSessionCount,
    setShowLimitAlert,
    referralCount,
    addSessionResult
  ]);
  
  const handleWithdrawal = useCallback(async () => {
    if (!userData) return;
    
    try {
      const currentBalance = userData.balance;
      
      if (currentBalance < 0.01) {
        toast({
          title: "Solde insuffisant",
          description: "Votre solde doit être supérieur à 0.01€ pour effectuer un retrait.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Retrait en cours",
        description: "Votre demande de retrait est en cours de traitement.",
        duration: 3000,
      });
      
      await resetBalance();
      balanceManager.forceBalanceSync(0);
      
      toast({
        title: "Retrait effectué !",
        description: `${currentBalance.toFixed(2)}€ ont été transférés sur votre compte.`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Error during withdrawal:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre demande de retrait.",
        variant: "destructive",
      });
    }
  }, [userData, resetBalance]);

  useEffect(() => {
    if (!userData) return;
    
    const autoGenInterval = setInterval(() => {
      window.dispatchEvent(new CustomEvent('dashboard:activity', { 
        detail: { level: 'medium' } 
      }));
      
      if (Math.random() > 0.5) {
        const microGain = Math.random() * 0.03 + 0.01;
        window.dispatchEvent(new CustomEvent('dashboard:micro-gain', { 
          detail: { amount: microGain, timestamp: Date.now(), animate: true } 
          }));
      }
    }, 8000);
    
    return () => clearInterval(autoGenInterval);
  }, [userData]);

  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    revenueGenerated,
    lastSessionTimestamp,
    sessionCount,
    isBotActive: true,
    activityLevel
  };
};

export default useDashboardSessions;
