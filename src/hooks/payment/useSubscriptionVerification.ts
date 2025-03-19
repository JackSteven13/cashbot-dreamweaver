
import { useState, useEffect } from 'react';
import { checkCurrentSubscription } from './utils';

/**
 * Hook for verifying and tracking a user's current subscription
 */
export const useSubscriptionVerification = () => {
  const [actualSubscription, setActualSubscription] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  // Vérifier l'abonnement actuel depuis Supabase au chargement
  useEffect(() => {
    const verifyCurrentSubscription = async () => {
      setIsChecking(true);
      const currentSub = await checkCurrentSubscription();
      if (currentSub) {
        setActualSubscription(currentSub);
        console.log("Abonnement vérifié depuis Supabase:", currentSub);
        
        // Mettre à jour le localStorage si nécessaire
        const localSub = localStorage.getItem('subscription');
        if (localSub !== currentSub) {
          console.log(`Mise à jour du localStorage : ${localSub} -> ${currentSub}`);
          localStorage.setItem('subscription', currentSub);
        }
      }
      setIsChecking(false);
    };
    
    verifyCurrentSubscription();
  }, []);

  const verifySubscriptionChange = async (targetPlan: string) => {
    // Vérifier à nouveau l'abonnement actuel
    const currentSub = await checkCurrentSubscription();
    
    // Si l'utilisateur est déjà abonné à ce plan, retourner true
    if (currentSub === targetPlan) {
      return true;
    }
    
    return false;
  };
  
  return {
    actualSubscription,
    isChecking,
    verifySubscriptionChange
  };
};
