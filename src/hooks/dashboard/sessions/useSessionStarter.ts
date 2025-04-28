import React, { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
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
    // Vérification de sécurité - éviter les doubles clics
    if (sessionInProgressRef.current || isStartingSession) {
      console.log("Session déjà en cours, ignoré");
      return;
    }

    try {
      console.log("Démarrage d'une session manuelle");
      sessionInProgressRef.current = true;
      setIsStartingSession(true);

      // Force la génération d'un gain substantiel pour récompenser l'utilisateur
      // Gain augmenté pour être plus visible
      const gain = Math.max(0.2, Math.random() * 0.3 + 0.2); // Entre 0.2€ et 0.5€
      
      const terminalSequence = createBackgroundTerminalSequence([
        "Initialisation de la session d'analyse manuelle..."
      ]);

      // Déclencher l'événement de début de session
      window.dispatchEvent(new CustomEvent('session:start', { 
        detail: { 
          manual: true,
          timestamp: Date.now() 
        }
      }));
      
      simulateActivity();

      // Simulation de l'analyse
      terminalSequence.add("Analyse des données en cours...");
      await new Promise(resolve => setTimeout(resolve, 800));
      terminalSequence.add("Optimisation des résultats...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Enregistrer le timestamp de la session
      const now = Date.now();
      localStorage.setItem('lastSessionTimestamp', now.toString());
      setLastSessionTimestamp(now);

      // Incrémenter le compteur de sessions
      await incrementSessionCount();

      // Afficher le résultat dans le terminal
      terminalSequence.add(`Résultats optimisés! Gain: ${gain.toFixed(2)}€`);

      // Mettre à jour les gains quotidiens dans le gestionnaire de solde
      balanceManager.addDailyGain(gain);

      // Mettre à jour le solde total
      await updateBalance(gain, `Session d'analyse manuelle: +${gain.toFixed(2)}€`, true);

      // Marquer la séquence comme terminée
      terminalSequence.complete(gain);

      // Déclencher un événement pour rafraîchir les transactions
      window.dispatchEvent(new CustomEvent('transactions:refresh'));

      // Force une mise à jour de l'interface
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: { 
          amount: gain,
          animate: true,
          userId: userData?.id || userData?.profile?.id,
          timestamp: Date.now()
        }
      }));

      // Notification du succès
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
      // Réinitialiser l'état après un délai pour l'animation
      setTimeout(() => {
        setIsStartingSession(false);
        sessionInProgressRef.current = false;
      }, 1000);
    }
  };

  return { isStartingSession, handleStartSession, lastSessionTimestamp };
};
