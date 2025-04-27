
import { useState, useCallback, useRef, useEffect } from 'react';
import { UserData } from '@/types/userData';
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
  userData: UserData | null;
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
  const { isBotActive, activityLevel } = useBotStatus();
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
    
    return true;
  }, [isSessionRunning, userData, dailySessionCount]);

  const startSession = useCallback(async () => {
    console.log("useManualSessions: startSession called");
    
    if (!canStartSession()) {
      if (userData?.subscription === 'freemium') {
        toast({
          title: "Limite quotidienne atteinte",
          description: "Les comptes freemium sont limités à 1 session par jour.",
          variant: "destructive",
          duration: 3000
        });
        return;
      } else {
        toast({
          title: "Session non disponible",
          description: "Veuillez attendre avant de démarrer une nouvelle session.",
          duration: 3000
        });
        return;
      }
    }
    
    try {
      setIsSessionRunning(true);
      lastSessionRef.current = Date.now();
      console.log("Démarrage de la session manuelle");
      
      startAnimation();
      
      const simulationTime = Math.random() * 1500 + 1500;
      
      let gain = 0;
      if (userData) {
        gain = calculateSessionGain(
          userData.subscription, 
          balanceManager.getDailyGains(),
          userData.referrals?.length || 0
        );
      }
      
      // Pour les comptes freemium, marquer immédiatement que la limite est atteinte
      if (userData?.subscription === 'freemium') {
        setLimitReached(true);
        localStorage.setItem('freemium_daily_limit_reached', 'true');
        localStorage.setItem('last_session_date', new Date().toDateString());
      }
      
      gain = parseFloat(gain.toFixed(2));
      
      console.log(`Gain calculé: ${gain}€`);
      
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
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: {
            amount: gain,
            currentBalance: newBalance,
            oldBalance: oldBalance,
            newBalance: newBalance,
            animate: true
          }
        }));
      }, 100);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('balance:animation', {
          detail: {
            amount: gain,
            oldBalance: oldBalance,
            newBalance: newBalance
          }
        }));
      }, 200);
      
      toast({
        title: "Session terminée",
        description: `Vous avez gagné ${gain.toFixed(2)}€`,
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
