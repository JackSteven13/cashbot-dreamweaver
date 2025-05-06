
import React, { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { simulateActivity } from '@/utils/animations/moneyParticles';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

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

      // Vérifier les limites quotidiennes
      const subscription = userData?.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const dailyGains = balanceManager.getDailyGains();
      
      // Vérifier si la limite est atteinte
      if (dailyGains >= dailyLimit) {
        toast({
          title: "Limite quotidienne atteinte",
          description: `Vous avez atteint votre limite quotidienne de ${dailyLimit}€.`,
          variant: "destructive",
          duration: 5000
        });
        setShowLimitAlert(true);
        sessionInProgressRef.current = false;
        setIsStartingSession(false);
        return;
      }
      
      // Pour les comptes freemium, limite stricte de 1 session par jour
      if (subscription === 'freemium' && dailySessionCount >= 1) {
        toast({
          title: "Limite de sessions atteinte",
          description: "Les comptes freemium sont limités à 1 session manuelle par jour.",
          variant: "destructive",
          duration: 5000
        });
        sessionInProgressRef.current = false;
        setIsStartingSession(false);
        return;
      }

      // Calcul du gain potentiel (réduit)
      const maxPotentialGain = Math.min(0.15, dailyLimit - dailyGains);
      const gain = Math.max(0.05, Math.random() * maxPotentialGain);
      const finalGain = parseFloat(gain.toFixed(2));
      
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
      terminalSequence.add(`Résultats optimisés! Gain: ${finalGain.toFixed(2)}€`);

      // Mettre à jour les gains quotidiens dans le gestionnaire de solde
      balanceManager.addDailyGain(finalGain);

      // Mettre à jour le solde total avec forceUpdate=true pour garantir la mise à jour
      await updateBalance(finalGain, `Session d'analyse manuelle: +${finalGain.toFixed(2)}€`, true);

      // Marquer la séquence comme terminée
      terminalSequence.complete(finalGain);

      // Déclencher un événement pour rafraîchir les transactions
      window.dispatchEvent(new CustomEvent('transactions:refresh'));

      // Force une mise à jour de l'interface avec un délai pour garantir l'affichage
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('session:completed', {
          detail: { 
            gain: finalGain,
            timestamp: Date.now()
          }
        }));
  
        window.dispatchEvent(new CustomEvent('balance:update', {
          detail: { 
            amount: finalGain,
            animate: true,
            userId: userData?.id || userData?.profile?.id,
            timestamp: Date.now()
          }
        }));
  
        // Force une mise à jour du solde avec un événement spécifique
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: { 
            newBalance: (userData.balance || 0) + finalGain
          }
        }));
      }, 500);

      // Notification du succès
      toast({
        title: "Session complétée",
        description: `Votre session a généré ${finalGain.toFixed(2)}€`,
      });
      
      // Si c'est un compte freemium, marquer comme limite atteinte pour aujourd'hui
      if (subscription === 'freemium') {
        const userId = userData?.id || userData?.profile?.id;
        if (userId) {
          localStorage.setItem(`freemium_daily_limit_reached_${userId}`, 'true');
          localStorage.setItem('last_session_date', new Date().toDateString());
        }
      }
      
      // Vérifier si on a atteint la limite quotidienne après cette session
      const updatedDailyGains = balanceManager.getDailyGains();
      if (updatedDailyGains >= dailyLimit * 0.95) {
        setShowLimitAlert(true);
        
        // Déclencher un événement pour informer les autres composants
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: {
            subscription: subscription,
            limit: dailyLimit,
            currentGains: updatedDailyGains,
            userId: userData?.id || userData?.profile?.id
          }
        }));
      }
      
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
