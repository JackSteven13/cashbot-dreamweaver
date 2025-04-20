
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useSessionStats } from './useSessionStats';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import balanceManager from '@/utils/balance/balanceManager';

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
  
  // Suivi des statistiques des sessions
  const { 
    addSessionResult, 
    sessionCount, 
    todaysGainRef, 
    activityLevel
  } = useSessionStats(userData?.subscription);
  
  // NOUVEAU - Maintenir le bot toujours actif
  useEffect(() => {
    // S'assurer que le bot est toujours actif
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
  
  // Fonction pour démarrer une session manuelle
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
      
      // AMÉLIORATION: Utiliser une animation visible
      const terminalAnimation = createBackgroundTerminalSequence([
        "Initialisation de l'analyse...",
        "Récupération des données..."
      ]);
      
      const startTime = Date.now();
      setLastSessionTimestamp(startTime);
      
      // Simuler un temps de traitement
      const processingTime = Math.random() * 1000 + 1500;
      await new Promise(resolve => {
        sessionTimeoutRef.current = setTimeout(resolve, processingTime);
      });
      
      terminalAnimation.addLine("Analyse des contenus publicitaires...");
      
      // Calculer le gain
      const subscription = userData.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription] || 0.5;
      
      // Déterminer si la limite quotidienne est atteinte
      const todaysGains = balanceManager.getDailyGains();
      const remainingToLimit = Math.max(0, dailyLimit - todaysGains);
      
      // Générer un gain basé sur l'abonnement
      let gain = 0;
      
      if (remainingToLimit > 0) {
        // Gain normal selon l'abonnement
        const baseGain = subscription === 'freemium' ? 0.05 : 0.1;
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8-1.2
        
        gain = Math.min(
          remainingToLimit,
          baseGain * randomFactor * (1 + referralCount * 0.05)
        );
        
        // Arrondir à 2 décimales
        gain = Math.round(gain * 100) / 100;
      } else {
        // Limite atteinte
        setShowLimitAlert(true);
        gain = Math.min(0.01, remainingToLimit);
      }
      
      terminalAnimation.addLine(`Analyse terminée! Gain calculé: ${gain.toFixed(2)}€`);
      
      // Mettre à jour le solde
      const sessionReport = `Session manuelle #${dailySessionCount + 1}: ${gain}€`;
      
      // Mettre à jour les statistiques locales
      addSessionResult(gain);
      balanceManager.updateBalance(gain);
      balanceManager.addDailyGain(gain);
      
      // Mettre à jour le solde dans la base de données
      await updateBalance(gain, sessionReport);
      
      // Incrémenter le compteur de sessions
      await incrementSessionCount();
      
      // Afficher une confirmation
      toast({
        title: "Session terminée",
        description: `${gain.toFixed(2)}€ ont été ajoutés à votre solde.`,
        duration: 3000,
      });
      
      // Sauvegarder pour référence future
      setRevenueGenerated(gain);
      
      // Animation terminée
      terminalAnimation.complete(gain);
      
      // Générer des animations d'activité
      window.dispatchEvent(new CustomEvent('dashboard:activity', { 
        detail: { level: 'high' } 
      }));
      
      // Générer des animations de petit gain
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('dashboard:micro-gain', { 
            detail: { amount: gain / 3, timestamp: Date.now() } 
          }));
        }, 1000 + i * 800);
      }
      
      // Durée totale
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
  
  // Fonction pour retirer le solde
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
      
      // Réinitialiser le solde
      await resetBalance();
      balanceManager.forceBalanceSync(0);
      
      // Confirmation
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

  // NOUVEAU - Génération périodique automatique
  useEffect(() => {
    if (!userData) return;
    
    // Simuler une génération automatique périodique
    const autoGenInterval = setInterval(() => {
      // Déclencher une activité sur le dashboard
      window.dispatchEvent(new CustomEvent('dashboard:activity', { 
        detail: { level: 'medium' } 
      }));
      
      // 50% de chance de générer un petit gain
      if (Math.random() > 0.5) {
        const microGain = Math.random() * 0.03 + 0.01;
        window.dispatchEvent(new CustomEvent('dashboard:micro-gain', { 
          detail: { amount: microGain, timestamp: Date.now() } 
        }));
      }
    }, 8000); // Toutes les 8 secondes
    
    return () => clearInterval(autoGenInterval);
  }, [userData]);

  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    revenueGenerated,
    lastSessionTimestamp,
    sessionCount,
    isBotActive: true, // Toujours actif
    activityLevel
  };
};

export default useDashboardSessions;
