
import { useState, useCallback, useRef, useEffect } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { calculateSessionGain } from '@/utils/sessions/sessionCalculator';
import { useBotStatus } from '@/hooks/useBotStatus';
import { useSessionAnimations } from '@/hooks/sessions/animations/useSessionAnimations';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { addDailyGain, getDailyGains } from '@/hooks/stats/utils/storageManager';

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

  // Vérifier si la limite quotidienne est atteinte pour les freemium
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

  // Vérifier si l'utilisateur peut démarrer une session manuelle
  const canStartSession = useCallback(() => {
    // Ne pas autoriser pendant qu'une session est en cours
    if (isSessionRunning) {
      return false;
    }
    
    // Vérifier le délai entre les sessions
    const now = Date.now();
    const timeSinceLastSession = now - lastSessionRef.current;
    const minDelay = 30000; // 30 secondes entre les sessions
    
    if (timeSinceLastSession < minDelay) {
      return false;
    }
    
    // Vérifier les limites quotidiennes de sessions pour les comptes freemium
    if (userData && userData.subscription === 'freemium') {
      // Strictement une seule session par jour pour les comptes freemium
      if (dailySessionCount >= 1 || limitReached) {
        return false;
      }
      
      // Vérifier aussi la limite financière
      const currentDailyGains = getDailyGains();
      const dailyLimit = SUBSCRIPTION_LIMITS['freemium'] || 0.5;
      
      if (currentDailyGains >= dailyLimit) {
        setLimitReached(true);
        return false;
      }
    }
    
    // Vérifier les limites financières quotidiennes
    if (userData) {
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const todaysGains = balanceManager.getDailyGains();
      
      // Si l'utilisateur a atteint ou dépassé la limite quotidienne
      if (todaysGains >= dailyLimit) {
        return false;
      }
    }
    
    return true;
  }, [isSessionRunning, userData, dailySessionCount, limitReached]);

  // Fonction pour démarrer une session manuelle
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
      
      // Déclencher l'animation d'analyse
      startAnimation();
      
      // Simuler une durée d'analyse (entre 1.5 et 3 secondes)
      const simulationTime = Math.random() * 1500 + 1500;
      
      // Calculer le gain basé sur l'abonnement, avec un facteur aléatoire
      let gain = 0;
      if (userData) {
        // Utiliser la fonction de calcul du gain
        gain = calculateSessionGain(
          userData.subscription, 
          dailySessionCount,
          activityLevel
        );
      }
      
      // Pour les comptes freemium, vérifier strictement la limite quotidienne
      if (userData?.subscription === 'freemium') {
        const currentDailyGains = getDailyGains();
        const dailyLimit = SUBSCRIPTION_LIMITS['freemium'] || 0.5;
        const remainingLimit = dailyLimit - currentDailyGains;
        
        // Limiter le gain pour ne pas dépasser
        gain = Math.min(gain, remainingLimit);
        
        // Si gain négatif ou nul après vérification, bloquer la session
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
      
      // Arrondir le gain à 2 décimales
      gain = parseFloat(gain.toFixed(2));
      
      console.log(`Gain calculé: ${gain}€`);
      
      // Attendre la fin de la simulation
      await new Promise(resolve => {
        sessionTimeoutRef.current = setTimeout(resolve, simulationTime);
      });
      
      // Ajouter le gain au total quotidien
      if (!addDailyGain(gain)) {
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite de gain journalier (${SUBSCRIPTION_LIMITS[userData?.subscription as keyof typeof SUBSCRIPTION_LIMITS || 'freemium']}€).`,
          variant: "destructive",
          duration: 3000
        });
        stopAnimation();
        setIsSessionRunning(false);
        return;
      }
      
      // Mettre à jour le solde via balanceManager
      balanceManager.addDailyGain(gain);
      balanceManager.addToBalance(gain);
      
      // Créer le rapport de la session
      const sessionReport = `Session manuelle #${dailySessionCount + 1}: ${gain.toFixed(2)}€ générés.`;
      
      // Mettre à jour le solde via la fonction fournie
      await updateBalance(gain, sessionReport);
      
      // Incrémenter le compteur de sessions
      await incrementSessionCount();
      
      // Vérifier si la limite est atteinte pour les comptes freemium
      if (userData?.subscription === 'freemium') {
        const updatedDailyGains = getDailyGains();
        if (updatedDailyGains >= (SUBSCRIPTION_LIMITS['freemium'] || 0.5) || dailySessionCount >= 0) {
          setLimitReached(true);
        }
      }
      
      // Afficher un toast de confirmation
      toast({
        title: "Session terminée",
        description: `Vous avez gagné ${gain.toFixed(2)}€`,
        duration: 3000
      });
      
      // Terminer l'animation
      stopAnimation();
      console.log("Fin de la session manuelle");
      
      // Déclencher des événements de dashboard pour les animations
      window.dispatchEvent(new CustomEvent('dashboard:activity', { detail: { level: 'high' } }));
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('dashboard:micro-gain', { 
            detail: { amount: gain / 3, timestamp: Date.now() } 
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
    canStartSession: canStartSession(),
    limitReached
  };
};

export default useManualSessions;
