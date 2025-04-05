
import { useState } from 'react';
import { UserData } from '@/types/userData';
import { getEffectiveSubscription, SUBSCRIPTION_LIMITS } from '@/utils/subscription/subscriptionStatus';
import { handleError, ErrorType } from '@/utils/errorHandling';

interface SessionGainResult {
  success: boolean;
  finalGain: number;
  newBalance: number;
}

export const useSessionGain = () => {
  const [lastGain, setLastGain] = useState<number | null>(null);

  const calculateSessionGain = async (
    userData: UserData,
    currentBalance: number,
    setShowLimitAlert: (show: boolean) => void
  ): Promise<SessionGainResult> => {
    try {
      if (!userData) {
        throw new Error('Données utilisateur non disponibles');
      }

      // Get effective subscription (taking free trials into account)
      const effectiveSubscription = getEffectiveSubscription(userData.subscription || 'freemium');
      
      // Get daily limit for this subscription
      const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Ensure currentBalance is a number
      const safeCurrentBalance = typeof currentBalance === 'number' ? currentBalance : 0;
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate today's gains (not related to total balance)
      const todaysTransactions = userData.transactions.filter(tx => 
        tx.date.startsWith(today) && tx.gain > 0
      );
      
      const todaysGains = todaysTransactions.reduce((sum, tx) => sum + tx.gain, 0);
      
      // Calculate how much more we can earn today
      const remainingAllowedGain = Math.max(0, dailyLimit - todaysGains);
      
      if (remainingAllowedGain <= 0) {
        // User has reached their daily limit
        setShowLimitAlert(true);
        return { success: false, finalGain: 0, newBalance: safeCurrentBalance };
      }
      
      // Calculate potential gain for this session
      let potentialGain: number;
      
      switch (effectiveSubscription) {
        case 'elite':
          // 0.30€ - 0.70€ per session
          potentialGain = Math.random() * (0.70 - 0.30) + 0.30;
          break;
        case 'gold':
          // 0.20€ - 0.50€ per session
          potentialGain = Math.random() * (0.50 - 0.20) + 0.20;
          break;
        case 'starter':
          // 0.10€ - 0.30€ per session
          potentialGain = Math.random() * (0.30 - 0.10) + 0.10;
          break;
        default:
          // 0.05€ - 0.15€ per session for freemium
          potentialGain = Math.random() * (0.15 - 0.05) + 0.05;
      }
      
      // Round to 2 decimals
      potentialGain = Math.round(potentialGain * 100) / 100;
      
      // Limit gain to remaining allowed amount
      const finalGain = Math.min(potentialGain, remainingAllowedGain);
      const newBalance = safeCurrentBalance + finalGain;
      
      // Update local state for last gain
      setLastGain(finalGain);
      
      // Check if today's limit is now reached
      if (todaysGains + finalGain >= dailyLimit) {
        setShowLimitAlert(true);
      }
      
      // Record session timestamp
      localStorage.setItem(`lastSession_${userData.username}`, new Date().toISOString());
      
      return { success: true, finalGain, newBalance };
    } catch (error) {
      handleError(error, "Erreur lors du calcul du gain de session", ErrorType.UNKNOWN);
      return { success: false, finalGain: 0, newBalance: currentBalance || 0 };
    }
  };

  return {
    calculateSessionGain,
    lastGain
  };
};
