import React, { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { simulateActivity } from '@/utils/animations/moneyParticles';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { supabase } from '@/integrations/supabase/client';

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
  const userId = userData?.profile?.id || userData?.id;

  // Keep sessionCountRef in sync
  useEffect(() => {
    sessionCountRef.current = dailySessionCount;
  }, [dailySessionCount]);

  // Réinitialiser les limites quotidiennes si nécessaire
  useEffect(() => {
    if (!userId) return;
    
    const checkForNewDay = () => {
      const lastSessionDate = localStorage.getItem(`last_session_date_${userId}`);
      const today = new Date().toDateString();
      
      if (!lastSessionDate || lastSessionDate !== today) {
        // C'est un nouveau jour, réinitialiser les limites
        localStorage.removeItem(`daily_limit_reached_${userId}`);
        localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
        balanceManager.resetDailyGains();
        
        console.log("Nouveau jour détecté, limites quotidiennes réinitialisées");
      }
    };
    
    checkForNewDay();
  }, [userId]);

  // Vérifier si le compte freemium a déjà atteint sa limite quotidienne
  const checkFreemiumLimit = () => {
    if (!userData || !userData.id) return false;
    
    if (userData?.subscription === 'freemium') {
      // Vérifier si nous avons déjà une session aujourd'hui
      const limitReached = localStorage.getItem(`freemium_daily_limit_reached_${userData.id}`);
      const lastSessionDate = localStorage.getItem(`last_session_date_${userData.id}`);
      const today = new Date().toDateString();
      
      // Si ce n'est pas un nouveau jour et que la limite est déjà atteinte
      if (lastSessionDate === today && (limitReached === 'true' || sessionCountRef.current >= 1)) {
        return true;
      }
    }
    return false;
  };

  // Fonction pour vérifier si une session est possible
  const canStartNewSession = (): boolean => {
    // Si une session est déjà en cours, bloquer
    if (sessionInProgressRef.current || isStartingSession) {
      console.log("Session déjà en cours, nouvelle requête bloquée");
      return false;
    }
    
    // Vérifier le délai minimum entre sessions
    if (lastSessionTimestamp) {
      const now = Date.now();
      if (now - lastSessionTimestamp < 5000) { // 5 secondes minimum
        console.log("Session trop récente, requête bloquée");
        return false;
      }
    }
    
    // Pour les comptes freemium, vérifier la limite stricte
    if (userData?.subscription === 'freemium' && checkFreemiumLimit()) {
      console.log("Limite de session freemium atteinte, requête bloquée");
      return false;
    }
    
    // Vérifier si la limite quotidienne est déjà atteinte
    if (userData?.id) {
      const limitReached = localStorage.getItem(`daily_limit_reached_${userData.id}`) === 'true';
      if (limitReached) {
        console.log("Limite quotidienne déjà atteinte, requête bloquée");
        return false;
      }
    }
    
    // Vérifier les limites quotidiennes
    const subscription = userData?.subscription || 'freemium';
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    const currentDailyGains = balanceManager.getDailyGains();
    
    if (currentDailyGains >= dailyLimit) {
      console.log(`Limite quotidienne dépassée: ${currentDailyGains}€ >= ${dailyLimit}€, requête bloquée`);
      return false;
    }
    
    return true;
  };

  const handleStartSession = async () => {
    // Double vérification pour éviter les démarrages multiples
    if (sessionInProgressRef.current || isStartingSession) {
      console.log("Session déjà en cours, ignorée");
      toast({
        title: "Session en cours",
        description: "Veuillez attendre la fin de la session en cours.",
        duration: 3000
      });
      return;
    }
    
    // Vérifier si une session peut être démarrée
    if (!canStartNewSession()) {
      if (userData?.subscription === 'freemium' && checkFreemiumLimit()) {
        toast({
          title: "Limite quotidienne atteinte",
          description: "Les comptes freemium sont limités à 1 session par jour.",
          variant: "destructive",
          duration: 4000
        });
      } else {
        const subscription = userData?.subscription || 'freemium';
        const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        const currentDailyGains = balanceManager.getDailyGains();
        
        if (currentDailyGains >= dailyLimit) {
          toast({
            title: "Limite quotidienne atteinte",
            description: `Vous avez atteint votre limite quotidienne de ${dailyLimit}€.`,
            variant: "destructive",
            duration: 4000
          });
          setShowLimitAlert(true);
        } else {
          toast({
            title: "Veuillez patienter",
            description: "Une session est déjà en cours ou trop récente.",
            duration: 3000
          });
        }
      }
      return;
    }

    try {
      // Marquer comme en cours de traitement
      sessionInProgressRef.current = true;
      setIsStartingSession(true);
      
      // Vérifications supplémentaires
      const subscription = userData?.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const currentDailyGains = balanceManager.getDailyGains();
      
      // Dernière vérification de la limite
      if (currentDailyGains >= dailyLimit) {
        toast({
          title: "Limite quotidienne atteinte",
          description: `Vous avez atteint votre limite quotidienne de ${dailyLimit}€.`,
          variant: "destructive",
          duration: 4000
        });
        setShowLimitAlert(true);
        sessionInProgressRef.current = false;
        setIsStartingSession(false);
        return;
      }

      // Créer et afficher une animation de terminal
      const terminalSequence = createBackgroundTerminalSequence([
        "Initialisation de la session d'analyse manuelle..."
      ]);

      // Émettre un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('session:start', { 
        detail: { 
          manual: true,
          timestamp: Date.now() 
        }
      }));
      
      // Déclencher l'animation d'activité
      simulateActivity();

      // Animation de traitement
      terminalSequence.add("Analyse des données en cours...");
      await new Promise(resolve => setTimeout(resolve, 800));
      terminalSequence.add("Optimisation des résultats...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Calculer le gain en fonction de l'abonnement et des limites
      const remainingAllowance = dailyLimit - currentDailyGains;
      let gain = 0;
      
      if (subscription === 'freemium') {
        // Gain fixe pour les comptes freemium (entre 0.2€ et 0.3€)
        gain = Math.min(0.2 + Math.random() * 0.1, remainingAllowance);
      } else {
        // Pour les autres comptes, gain plus élevé mais toujours dans la limite
        gain = Math.min(0.3 + Math.random() * 0.2, remainingAllowance);
      }
      
      // Arrondir à 2 décimales
      gain = parseFloat(gain.toFixed(2));

      // Enregistrer le timestamp de la session
      const now = Date.now();
      localStorage.setItem('lastSessionTimestamp', now.toString());
      setLastSessionTimestamp(now);

      // Pour les comptes freemium, marquer que la limite est atteinte après une session
      if (subscription === 'freemium' && userId) {
        localStorage.setItem(`freemium_daily_limit_reached_${userId}`, 'true');
        localStorage.setItem(`last_session_date_${userId}`, new Date().toDateString());
      }

      // Incrémenter le compteur de sessions
      await incrementSessionCount();

      // Afficher le résultat dans l'animation
      terminalSequence.add(`Résultats optimisés! Gain: ${gain.toFixed(2)}€`);

      // Mettre à jour les gains
      balanceManager.addDailyGain(gain);
      const oldBalance = balanceManager.getCurrentBalance();
      balanceManager.updateBalance(gain);
      const newBalance = balanceManager.getCurrentBalance();

      // Mettre à jour le solde dans la base de données
      const sessionReport = `Session d'analyse manuelle: +${gain.toFixed(2)}€`;
      await updateBalance(gain, sessionReport, true);

      // Marquer l'animation comme terminée
      terminalSequence.complete(gain);

      // Déclencher un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('transactions:refresh'));
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          oldBalance,
          newBalance,
          animate: true,
          duration: 1500
        }
      }));
      window.dispatchEvent(new CustomEvent('session:completed', {
        detail: {
          gain,
          timestamp: now,
          userId
        }
      }));

      // Informer l'utilisateur
      toast({
        title: "Session complétée",
        description: `Votre session a généré ${gain.toFixed(2)}€`,
        duration: 3000
      });
      
      // Vérifier si la limite est atteinte après cette session
      const updatedGains = currentDailyGains + gain;
      if (updatedGains >= dailyLimit * 0.9) {
        setShowLimitAlert(true);
      }
      
      // Si la limite est strictement atteinte, déclencher l'événement
      if (updatedGains >= dailyLimit) {
        if (userId) {
          localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
          localStorage.setItem(`last_session_date_${userId}`, new Date().toDateString());
        }
        
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: {
            subscription,
            limit: dailyLimit,
            currentGains: updatedGains,
            userId
          }
        }));
      }
      
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la session.",
        variant: "destructive",
        duration: 4000
      });
    } finally {
      // Réinitialiser les états après un délai pour l'animation
      setTimeout(() => {
        setIsStartingSession(false);
        sessionInProgressRef.current = false;
      }, 1000);
    }
  };

  return { isStartingSession, handleStartSession, lastSessionTimestamp };
};

export default useSessionStarter;
