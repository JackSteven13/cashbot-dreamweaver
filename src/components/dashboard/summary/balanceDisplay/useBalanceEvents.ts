
import { useEffect, useState } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { getEffectiveSubscription } from '@/utils/auth/subscriptionUtils';

export interface BalanceState {
  dailyGains: number;
  limitPercentage: number;
  isLimitReached: boolean;
  isNearLimit: boolean;
  effectiveSubscription: string;
  dailyLimit: number;
}

export const useBalanceEvents = (subscription: string) => {
  const [balanceState, setBalanceState] = useState<BalanceState>({
    dailyGains: 0,
    limitPercentage: 0,
    isLimitReached: false,
    isNearLimit: false,
    effectiveSubscription: subscription,
    dailyLimit: 0
  });

  // Mettre à jour l'état en fonction des nouvelles données
  const updateBalanceState = () => {
    const effectiveSub = getEffectiveSubscription(subscription);
    const todaysGains = balanceManager.getDailyGains();
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    const percentage = Math.min(100, (todaysGains / dailyLimit) * 100);
    
    setBalanceState({
      dailyGains: todaysGains,
      limitPercentage: percentage,
      isLimitReached: percentage >= 99,
      isNearLimit: percentage >= 85 && percentage < 99,
      effectiveSubscription: effectiveSub,
      dailyLimit
    });
  };

  // Initialiser l'état et configurer les écouteurs d'événements
  useEffect(() => {
    updateBalanceState();
    
    const handleBalanceUpdate = () => {
      updateBalanceState();
    };
    
    const handleDailyGainsUpdate = (event: CustomEvent) => {
      updateBalanceState();
      
      // Vérifier si la limite est atteinte et déclencher l'événement correspondant
      const { dailyGains } = event.detail || {};
      if (dailyGains) {
        const effectiveSub = getEffectiveSubscription(subscription);
        const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        const percentage = Math.min(100, (dailyGains / dailyLimit) * 100);
        
        if (percentage >= 99) {
          window.dispatchEvent(new CustomEvent('daily:limit:reached', {
            detail: { 
              subscription: effectiveSub,
              dailyLimit,
              currentGains: dailyGains
            }
          }));
        } else if (percentage >= 85) {
          window.dispatchEvent(new CustomEvent('daily:limit:warning', {
            detail: { 
              subscription: effectiveSub,
              dailyLimit,
              currentGains: dailyGains,
              percentage
            }
          }));
        }
      }
    };
    
    // Écouter les événements de mise à jour
    window.addEventListener('balance:update', handleBalanceUpdate);
    window.addEventListener('daily:gains:update', handleDailyGainsUpdate);
    window.addEventListener('db:balance-updated', handleBalanceUpdate);
    
    // Actualiser périodiquement
    const intervalId = setInterval(updateBalanceState, 30000);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate);
      window.removeEventListener('daily:gains:update', handleDailyGainsUpdate);
      window.removeEventListener('db:balance-updated', handleBalanceUpdate);
      clearInterval(intervalId);
    };
  }, [subscription]);

  return balanceState;
};
