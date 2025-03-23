
import { useState, useEffect } from 'react';
import { checkCurrentSubscription } from './utils';

/**
 * Hook for checking the current user subscription
 */
export const useSubscriptionCheck = () => {
  const [actualSubscription, setActualSubscription] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const verifyCurrentSubscription = async () => {
      setIsChecking(true);
      const currentSub = await checkCurrentSubscription();
      if (currentSub) {
        setActualSubscription(currentSub);
        console.log("Subscription verified from Supabase:", currentSub);
        
        // Update localStorage if necessary
        const localSub = localStorage.getItem('subscription');
        if (localSub !== currentSub) {
          console.log(`Updating localStorage: ${localSub} -> ${currentSub}`);
          localStorage.setItem('subscription', currentSub);
        }
      }
      setIsChecking(false);
    };
    
    verifyCurrentSubscription();
  }, []);
  
  const recheckSubscription = async () => {
    setIsChecking(true);
    const currentSub = await checkCurrentSubscription();
    setActualSubscription(currentSub);
    setIsChecking(false);
    return currentSub;
  };
  
  return {
    actualSubscription,
    isChecking,
    recheckSubscription
  };
};
