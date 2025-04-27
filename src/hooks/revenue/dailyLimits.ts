
import { toast } from '@/components/ui/use-toast';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { calculateTodaysGains } from '@/utils/userData/transactionUtils';

export const checkAndUpdateDailyLimits = async (
  userData: any,
  setDailyLimitProgress: (progress: number) => void,
  setLimitReached: (reached: boolean) => void,
  setIsBotActive: (active: boolean) => void
) => {
  if (!userData) {
    setDailyLimitProgress(0);
    return null;
  }

  const effectiveSub = getEffectiveSubscription(userData.subscription);
  const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Get daily gains from centralized manager
  const dailyGains = balanceManager.getDailyGains();
  
  // Calculate percentage of daily limit
  const percentage = Math.min(100, (dailyGains / limit) * 100);
  setDailyLimitProgress(percentage);
  
  // Check if limit is reached (90% of limit for early prevention)
  const isLimitReached = dailyGains >= limit * 0.9;
  
  if (isLimitReached) {
    toast({
      title: "Limite quotidienne atteinte",
      description: `Vous avez atteint votre limite quotidienne de ${limit.toFixed(2)}€.`,
      variant: "destructive",
      duration: 5000
    });
    
    // Broadcast event to update UI components
    window.dispatchEvent(new CustomEvent('daily-limit:reached', {
      detail: { 
        subscription: effectiveSub,
        limit: limit,
        currentGains: dailyGains
      }
    }));
    
    setLimitReached(true);
    setIsBotActive(false);
    localStorage.setItem('botActive', 'false');
  }

  return { limit, dailyGains, percentage };
};
