
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { calculateSessionGain } from '@/utils/sessions/sessionCalculator';
import { useBotStatus } from '@/hooks/useBotStatus';
import { useSessionAnimations } from '@/hooks/sessions/animations/useSessionAnimations';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';

const addDailyGain = (gain: number): void => {
  const current = getDailyGains();
  localStorage.setItem('dailyGains', (current + gain).toFixed(2));
};

const getDailyGains = (): number => {
  const gains = localStorage.getItem('dailyGains');
  return gains ? parseFloat(gains) : 0;
};

interface ManualSessionHookProps {
  userData: any;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
}

export const useManualSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance
}: ManualSessionHookProps) => {
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const { isBotActive } = useBotStatus();
  const { startAnimation, stopAnimation } = useSessionAnimations();
  const [limitReached, setLimitReached] = useState(false);
  
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionRef = useRef<number>(0);

  // Vérifier si la limite quotidienne est atteinte pour les comptes freemium
  useEffect(() => {
    if (userData && userData.subscription === 'freemium') {
      // Pour les comptes freemium, la limite est STRICTEMENT de 1 session par jour
      const limitReached = localStorage.getItem('freemium_daily_limit_reached');
      const lastSessionDate = localStorage.getItem('last_session_date');
      const today = new Date().toDateString();
      
      if (dailySessionCount >= 1) {
        setLimitReached(true);
        localStorage.setItem('freemium_daily_limit_reached', 'true');
        localStorage.setItem('last_session_date', today);
      } else if (lastSessionDate === today && limitReached === 'true') {
        setLimitReached(true);
      } else if (lastSessionDate !== today) {
        // Si c'est un nouveau jour, réinitialiser la limite
        setLimitReached(false);
        localStorage.removeItem('freemium_daily_limit_reached');
      }
    }
  }, [userData, dailySessionCount]);

  const canStartSession = useCallback(() => {
    if (isSessionRunning) {
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastSession = now - lastSessionRef.current;
    const minDelay = 30000;
    
    if (timeSinceLastSession < minDelay) {
      return false;
    }
    
    // Pour les comptes freemium, vérifier STRICTEMENT la limite de 1 session par jour
    if (userData && userData.subscription === 'freemium') {
      // Vérifier si la limite journalière a déjà été enregistrée
      const limitReached = localStorage.getItem('freemium_daily_limit_reached');
      const lastSessionDate = localStorage.getItem('last_session_date'); 
      const today = new Date().toDateString();
      
      // Si ce n'est pas un nouveau jour et que la limite est atteinte
      if (lastSessionDate === today && (limitReached === 'true' || dailySessionCount >= 1)) {
        return false;
      }
    }
    
    // Vérifier si la limite quotidienne de gains est atteinte
    const dailyLimit = userData?.subscription === 'freemium' ? 0.5 : 
                     userData?.subscription === 'starter' ? 5 : 
                     userData?.subscription === 'gold' ? 15 : 25;
                     
    const currentDailyGains = getDailyGains();
    
    return currentDailyGains < dailyLimit * 0.95;
  }, [isSessionRunning, userData, dailySessionCount]);

  const startSession = useCallback(async () => {
    console.log("useManualSessions: startSession called");
    
    if (!userData) {
      toast({
        title: "Session non disponible",
        description: "Données utilisateur non disponibles.",
        duration: 3000
      });
      return;
    }
    
    if (!canStartSession()) {
      if (userData.subscription === 'freemium') {
        toast({
          title: "Limite quotidienne atteinte",
          description: "Les comptes freemium sont limités à 1 session par jour.",
          variant: "destructive",
          duration: 3000
        });
      } else {
        toast({
          title: "Session non disponible",
          description: "Veuillez attendre avant de démarrer une nouvelle session.",
          duration: 3000
        });
      }
      return;
    }
    
    try {
      setIsSessionRunning(true);
      lastSessionRef.current = Date.now();
      console.log("Démarrage de la session manuelle");
      
      startAnimation();
      
      const currentDailyGains = getDailyGains();
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Vérification stricte que la limite n'est pas atteinte
      if (currentDailyGains >= dailyLimit * 0.95) {
        toast({
          title: "Limite journalière presque atteinte",
          description: `Vous avez déjà généré ${currentDailyGains.toFixed(2)}€ aujourd'hui, proche de la limite de ${dailyLimit}€.`,
          variant: "destructive",
          duration: 5000
        });
        setIsSessionRunning(false);
        stopAnimation();
        return;
      }
      
      const simulationTime = Math.random() * 1500 + 1500;
      
      // Pour les comptes freemium, limiter strictement le gain
      let gain = 0;
      if (userData.subscription === 'freemium') {
        // Calculer le montant restant avant d'atteindre la limite
        const remainingAmount = dailyLimit - currentDailyGains;
        // Limiter le gain pour ne pas dépasser la limite
        gain = Math.min(Math.random() * 0.05 + 0.1, remainingAmount);
      } else {
        gain = calculateSessionGain(
          userData.subscription, 
          currentDailyGains,
          userData.referrals?.length || 0
        );
      }
      
      gain = parseFloat(gain.toFixed(2));
      
      // Pour les comptes freemium, marquer immédiatement que la limite est atteinte
      if (userData.subscription === 'freemium') {
        setLimitReached(true);
        localStorage.setItem('freemium_daily_limit_reached', 'true');
        localStorage.setItem('last_session_date', new Date().toDateString());
      }
      
      await new Promise(resolve => {
        sessionTimeoutRef.current = setTimeout(resolve, simulationTime);
      });
      
      const oldBalance = balanceManager.getCurrentBalance();
      
      addDailyGain(gain);
      
      balanceManager.addDailyGain(gain);
      balanceManager.updateBalance(gain);
      
      const newBalance = balanceManager.getCurrentBalance();
      
      const userId = userData?.profile?.id || userData?.id;
      if (!userId) {
        console.error("Missing user ID for transaction");
      }
      
      const sessionReport = `Session manuelle #${dailySessionCount + 1}: ${gain.toFixed(2)}€ générés.`;
      
      await updateBalance(gain, sessionReport, true);
      
      await incrementSessionCount();
      
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          oldBalance: oldBalance,
          newBalance: newBalance,
          animate: true,
          duration: 1500
        }
      }));
      
      // Show session completed toast
      toast({
        title: "Session complétée",
        description: `Votre session a généré ${gain.toFixed(2)}€`,
        duration: 3000
      });
      
      stopAnimation();
      console.log("Fin de la session manuelle");
      
    } catch (error) {
      console.error("Erreur lors de la session manuelle:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant l'analyse.",
        variant: "destructive"
      });
    } finally {
      setIsSessionRunning(false);
    }
  }, [
    canStartSession,
    userData,
    dailySessionCount,
    startAnimation,
    stopAnimation,
    updateBalance,
    incrementSessionCount
  ]);

  return {
    isSessionRunning,
    startSession,
    canStartSession: canStartSession(),
    limitReached
  };
};

export default useManualSessions;
