
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { getEffectiveSubscription, SUBSCRIPTION_LIMITS } from '@/utils/subscription/subscriptionStatus';
import { useSessionProtection } from './useSessionProtection';
import { useLimitChecking } from './useLimitChecking';
import { useSessionGain } from './useSessionGain';
import { UseManualSessionsProps, UseManualSessionsReturn } from './types';

export const useManualSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert
}: UseManualSessionsProps): UseManualSessionsReturn => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [localBalance, setLocalBalance] = useState(userData.balance);
  
  // Maintenir une référence locale au solde actuel pour éviter les conditions de course
  const currentBalanceRef = useRef<number>(userData.balance);
  
  // Mettre à jour la référence quand userData change
  useEffect(() => {
    if (currentBalanceRef.current !== userData.balance) {
      console.log("Updating balance reference from", currentBalanceRef.current, "to", userData.balance);
      currentBalanceRef.current = userData.balance;
      setLocalBalance(userData.balance);
    }
  }, [userData.balance]);
  
  // Hooks pour la gestion des sessions
  const { 
    checkBoostLimit, 
    updateBoostCount, 
    setClickDebounce, 
    clearLocks, 
    setLocks, 
    canStartNewSession 
  } = useSessionProtection();
  
  const { checkSessionLimit } = useLimitChecking();
  const { calculateSessionGain } = useSessionGain();

  const handleStartSession = async () => {
    // Vérifier si nous pouvons démarrer une nouvelle session
    if (!canStartNewSession()) {
      return;
    }
    
    // Vérifier la limite de boost pour prévenir les abus
    if (checkBoostLimit()) {
      return;
    }
    
    // Sauvegarder le solde actuel pour éviter toute réinitialisation visuelle
    const startingBalance = currentBalanceRef.current;
    
    // Vérifier la limite de session basée sur l'abonnement
    // Important: utiliser startingBalance et non currentBalanceRef.current pour le check
    if (!checkSessionLimit(userData, dailySessionCount, startingBalance, setShowLimitAlert)) {
      return;
    }
    
    // Définir la protection anti-rebond pour empêcher les clics rapides
    setClickDebounce();
    
    // Déclencher l'événement de démarrage de session pour les animations UI
    window.dispatchEvent(new CustomEvent('session:start'));
    
    try {
      // Définir tous les verrous et drapeaux
      setLocks();
      setIsStartingSession(true);
      
      // Incrémenter le compteur de sessions quotidiennes pour les comptes freemium
      if (userData.subscription === 'freemium') {
        await incrementSessionCount();
      }
      
      // TRÈS IMPORTANT: Ne pas réinitialiser l'affichage du solde pendant le traitement
      // mais utiliser la référence locale pour le calcul
      
      // Calculer le gain pour la session - NE PAS RÉINITIALISER le solde
      const { success, finalGain, newBalance } = await calculateSessionGain(
        userData,
        startingBalance, // Utiliser le solde préservé
        setShowLimitAlert
      );
      
      if (success && finalGain > 0) {
        console.log("Session successful, updating UI balance from", startingBalance, "to", newBalance);
        
        // Mettre à jour l'état local immédiatement pour refléter le changement dans l'UI
        setLocalBalance(newBalance);
        
        // Mettre à jour la référence locale avant l'appel API
        currentBalanceRef.current = newBalance;
        
        // Diffuser l'événement de mise à jour du solde pour les animations UI
        window.dispatchEvent(new CustomEvent('balance:update', { 
          detail: { amount: finalGain } 
        }));
        
        // Ajouter un petit délai pour permettre aux animations de se terminer
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mettre à jour le solde utilisateur dans la base de données avec le drapeau de mise à jour forcée UI
        await updateBalance(
          finalGain,
          `Session manuelle : Notre technologie a optimisé le processus et généré ${finalGain.toFixed(2)}€ de revenus pour votre compte ${userData.subscription}.`,
          true // Drapeau de mise à jour forcée UI
        );
        
        // Mettre à jour le compteur de boost pour la limitation de débit
        updateBoostCount();
        
        // Vérifier si la limite est maintenant atteinte
        const effectiveSub = getEffectiveSubscription(userData.subscription);
        const effectiveLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS];
        
        if (newBalance >= effectiveLimit) {
          setShowLimitAlert(true);
        }
      }
    } catch (error) {
      console.error("Error during session:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant la session. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      // Ajouter un léger délai avant de terminer pour permettre aux animations de se compléter
      setTimeout(() => {
        setIsStartingSession(false);
        clearLocks();
      }, 500);
    }
  };

  return {
    isStartingSession,
    handleStartSession,
    localBalance // Exporter le solde local pour les mises à jour directes de l'UI
  };
};

export default useManualSessions;
