import { useState, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { calculateSessionGain } from '@/utils/sessions/sessionCalculator';
import { useBotStatus } from '@/hooks/useBotStatus';
import { useSessionAnimations } from '@/hooks/sessions/animations/useSessionAnimations';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';

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
  
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionRef = useRef<number>(0);

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
    
    if (userData && userData.subscription === 'freemium' && dailySessionCount >= 1) {
      return false;
    }
    
    if (userData) {
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const todaysGains = balanceManager.getDailyGains();
      
      if (todaysGains >= dailyLimit) {
        return false;
      }
    }
    
    return true;
  }, [isSessionRunning, userData, dailySessionCount]);

  const startSession = useCallback(async () => {
    console.log("useManualSessions: startSession called");
    
    if (!canStartSession()) {
      toast({
        title: "Session non disponible",
        description: "Veuillez attendre avant de démarrer une nouvelle session.",
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
          dailySessionCount,
          activityLevel
        );
      }
      
      gain = parseFloat(gain.toFixed(2));
      
      console.log(`Gain calculé: ${gain}€`);
      
      await new Promise(resolve => {
        sessionTimeoutRef.current = setTimeout(resolve, simulationTime);
      });
      
      balanceManager.addDailyGain(gain);
      balanceManager.updateBalance(gain);
      
      const oldBalance = balanceManager.getCurrentBalance() - gain;
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          oldBalance: oldBalance,
          newBalance: balanceManager.getCurrentBalance(),
          animate: true,
          duration: 1500
        }
      }));
      
      const sessionReport = `Session manuelle #${dailySessionCount + 1}: ${gain.toFixed(2)}€ générés.`;
      
      await updateBalance(gain, sessionReport);
      
      await incrementSessionCount();
      
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
        }, 1000 + i * 1000);
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
    activityLevel,
    startAnimation,
    stopAnimation,
    updateBalance,
    incrementSessionCount
  ]);

  return {
    isSessionRunning,
    startSession,
    canStartSession: canStartSession()
  };
};

export default useManualSessions;
