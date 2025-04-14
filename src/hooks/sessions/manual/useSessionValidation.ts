
import { toast } from '@/components/ui/use-toast';
import { UserData } from '@/types/userData';
import { getEffectiveSubscription, SUBSCRIPTION_LIMITS } from '@/utils/subscription/subscriptionStatus';

/**
 * Functions to validate session requirements and limits
 */
export const checkDailyLimit = (
  userData: UserData | Partial<UserData>,
  todaysGains: number,
  setShowLimitAlert: (show: boolean) => void
): boolean => {
  // Check if daily limit is already reached based on subscription
  const effectiveSub = getEffectiveSubscription(userData.subscription || 'freemium');
  const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  if (todaysGains >= dailyLimit) {
    setShowLimitAlert(true);
    toast({
      title: "Limite journalière atteinte",
      description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
      variant: "destructive"
    });
    return false;
  }
  
  return true;
};

export const updateLimitAlertStatus = (
  todaysGains: number, 
  finalGain: number,
  effectiveSub: string,
  effectiveLimit: number,
  setShowLimitAlert: (show: boolean) => void
): void => {
  const updatedGains = todaysGains + finalGain;
  if (updatedGains >= effectiveLimit) {
    setShowLimitAlert(true);
  }
};
