import React, { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
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

      // Pour les comptes freemium, vérification stricte de la limite
      if (userData?.subscription === 'freemium') {
        // Vérifier d'abord si la limite est déjà atteinte aujourd'hui
        const limitReached = localStorage.getItem('freemium_daily_limit_reached');
        const lastSessionDate = localStorage.getItem('last_session_date');
        const today = new Date().toDateString();
        
        // Si ce n'est pas un nouveau jour et que la limite est déjà atteinte
        if (lastSessionDate === today && (limitReached === 'true' || sessionCountRef.current >= 1)) {
          toast({
            title: "Limite quotidienne atteinte",
            description: "Les comptes freemium sont limités à 1 session par jour.",
            variant: "destructive"
          });
          
          setShowLimitAlert(true);
          sessionInProgressRef.current = false;
          setIsStartingSession(false);
          return;
        }
      }

      const currentDailyGains = balanceManager.getDailyGains();
      
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

      // Pour les comptes freemium, marquer que la limite quotidienne est atteinte
      if (userData?.subscription === 'freemium') {
        localStorage.setItem('freemium_daily_limit_reached', 'true');
        localStorage.setItem('last_session_date', new Date().toDateString());
      }

      await incrementSessionCount();

      terminalSequence.add(`Résultats optimisés! Gain: ${gain.toFixed(2)}€`);

      // Mettre à jour les gains quotidiens dans le gestionnaire de solde
      balanceManager.addDailyGain(gain);

      await updateBalance(gain, `Session d'analyse manuelle: +${gain.toFixed(2)}€`);

      terminalSequence.complete(gain);

      // Déclencher un événement pour rafraîchir les transactions
      window.dispatchEvent(new CustomEvent('transactions:refresh'));

      toast({
        title: "Session complétée",
        description: `Votre session a généré ${gain.toFixed(2)}€`,
      });
      
      // Pour les comptes freemium, toujours montrer l'alerte de limite après la première session
      if (userData?.subscription === 'freemium') {
        setShowLimitAlert(true);
      }
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

export default useSessionStarter;
