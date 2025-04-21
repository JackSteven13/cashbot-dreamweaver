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

  useEffect(() => {
    if (userData && userData.subscription === 'freemium') {
      const dailyGains = getDailyGains();
      const dailyLimit = SUBSCRIPTION_LIMITS['freemium'] || 0.5;
      
      if (dailyGains >= dailyLimit || dailySessionCount >= 1) {
        setLimitReached(true);
      } else {
        setLimitReached(false);
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
    
    if (userData && userData.subscription === 'freemium') {
      if (dailySessionCount >= 1 || limitReached) {
        return false;
      }
      
      const currentDailyGains = getDailyGains();
      const dailyLimit = SUBSCRIPTION_LIMITS['freemium'] || 0.5;
      
      if (currentDailyGains >= dailyLimit) {
        setLimitReached(true);
        return false;
      }
    }
    
    if (userData) {
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const todaysGains = balanceManager.getDailyGains();
      
      if (todaysGains >= dailyLimit) {
        return false;
      }
    }
    
    return true;
  }, [isSessionRunning, userData, dailySessionCount, limitReached]);

  const startSession = useCallback(async () => {
    console.log("useManualSessions: startSession called");
    
    if (!canStartSession()) {
      toast({
        title: "Session non disponible",
        description: userData?.subscription === 'freemium' ? 
          "Compte Freemium limité à 1 session par jour." : 
          "Veuillez attendre avant de démarrer une nouvelle session.",
        duration: 3000
      });
      return;
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
      
      if (userData?.subscription === 'freemium') {
        const currentDailyGains = getDailyGains();
        const dailyLimit = SUBSCRIPTION_LIMITS['freemium'] || 0.5;
        const remainingLimit = dailyLimit - currentDailyGains;
        
        gain = Math.min(gain, remainingLimit);
        
        if (gain <= 0) {
          stopAnimation();
          setIsSessionRunning(false);
          
          toast({
            title: "Limite journalière atteinte",
            description: "Les comptes freemium sont limités à 0,50€ par jour.",
            variant: "destructive",
            duration: 3000
          });
          
          return;
        }
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
      
      if (userData?.subscription === 'freemium') {
        const updatedDailyGains = getDailyGains();
        if (updatedDailyGains >= (SUBSCRIPTION_LIMITS['freemium'] || 0.5) || dailySessionCount >= 0) {
          setLimitReached(true);
        }
      }
      
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
      
      window.dispatchEvent(new CustomEvent('dashboard:activity', { detail: { level: 'high' } }));
      
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('dashboard:micro-gain', { 
            detail: { 
              amount: gain / 3, 
              timestamp: Date.now(),
              animate: true 
            } 
          }));
        }, 500 + i * 400);
      }
      
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
