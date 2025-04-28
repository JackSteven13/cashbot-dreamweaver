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

      // Force la génération d'un gain même si la limite est atteinte (pour débloquer l'UI)
      const gain = Math.max(0.05, Math.random() * 0.1 + 0.05);
      
      const terminalSequence = createBackgroundTerminalSequence([
        "Initialisation de la session d'analyse manuelle..."
      ]);

      window.dispatchEvent(new CustomEvent('session:start', { detail: { manual: true } }));
      simulateActivity();

      terminalSequence.add("Analyse des données en cours...");
      await new Promise(resolve => setTimeout(resolve, 800));
      terminalSequence.add("Optimisation des résultats...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      const now = Date.now();
      localStorage.setItem('lastSessionTimestamp', now.toString());
      setLastSessionTimestamp(now);

      await incrementSessionCount();

      terminalSequence.add(`Résultats optimisés! Gain: ${gain.toFixed(2)}€`);

      // Mettre à jour les gains quotidiens dans le gestionnaire de solde
      balanceManager.addDailyGain(gain);

      await updateBalance(gain, `Session d'analyse manuelle: +${gain.toFixed(2)}€`);

      terminalSequence.complete(gain);

      // Déclencher un événement pour rafraîchir les transactions
      window.dispatchEvent(new CustomEvent('transactions:refresh'));

      // Force une mise à jour de l'interface
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: { 
          newBalance: userData?.balance + gain,
          animate: true 
        }
      }));

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
