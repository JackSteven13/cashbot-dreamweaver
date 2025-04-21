import React, { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { canStartManualSession, SessionCheckResult } from '@/utils/subscription/sessionManagement';
import { calculateManualSessionGain } from '@/utils/subscription/sessionGain';
import { simulateActivity } from '@/utils/animations/moneyParticles';
import balanceManager from '@/utils/balance/balanceManager';

export interface UseSessionStarterProps {
  userData: any;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useSessionStarter = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert
}: UseSessionStarterProps) => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [lastSessionTimestamp, setLastSessionTimestamp] = useState<number | null>(() => {
    const stored = localStorage.getItem('lastSessionTimestamp');
    return stored ? parseInt(stored, 10) : null;
  });

  const sessionInProgressRef = useRef(false);
  const sessionCountRef = useRef(dailySessionCount);

  // Keep sessionCountRef in sync
  useEffect(() => {
    sessionCountRef.current = dailySessionCount;
  }, [dailySessionCount]);

  const handleStartSession = async () => {
    if (sessionInProgressRef.current || isStartingSession) return;

    try {
      sessionInProgressRef.current = true;
      setIsStartingSession(true);

      const currentDailyGains = balanceManager.getDailyGains();

      const result: SessionCheckResult = canStartManualSession(
        userData?.subscription || 'freemium',
        sessionCountRef.current,
        currentDailyGains
      );

      if (!result.canStart) {
        toast({
          title: "Session impossible",
          description: result.reason || "Vous ne pouvez pas démarrer de session maintenant.",
          variant: "destructive"
        });

        const now = Date.now();
        localStorage.setItem('lastSessionTimestamp', now.toString());
        setLastSessionTimestamp(now);
        return;
      }

      const terminalSequence = createBackgroundTerminalSequence([
        "Initialisation de la session d'analyse manuelle..."
      ]);

      window.dispatchEvent(new CustomEvent('session:start', { detail: { manual: true } }));
      simulateActivity();

      terminalSequence.add("Analyse des données en cours...");
      await new Promise(resolve => setTimeout(resolve, 800));
      terminalSequence.add("Optimisation des résultats...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      const gain = calculateManualSessionGain(
        userData?.subscription || 'freemium',
        currentDailyGains,
        userData?.referrals?.length || 0
      );

      const now = Date.now();
      localStorage.setItem('lastSessionTimestamp', now.toString());
      setLastSessionTimestamp(now);

      await incrementSessionCount();

      terminalSequence.add(`Résultats optimisés! Gain: ${gain.toFixed(2)}€`);

      balanceManager.addDailyGain(gain);

      await updateBalance(gain, `Session d'analyse manuelle: +${gain.toFixed(2)}€`);

      terminalSequence.complete(gain);

      window.dispatchEvent(new CustomEvent('transactions:refresh'));

      toast({
        title: "Session complétée",
        description: `Votre session a généré ${gain.toFixed(2)}€`,
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la session.",
        variant: "destructive"
      });
    } finally {
      setIsStartingSession(false);
      sessionInProgressRef.current = false;
    }
  };

  return { isStartingSession, handleStartSession, lastSessionTimestamp };
};
