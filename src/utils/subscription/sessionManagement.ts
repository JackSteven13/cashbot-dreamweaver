
import { normalizeSubscription, getEffectiveSubscription, checkDailyLimit } from "./subscriptionStatus";
import { SUBSCRIPTION_LIMITS } from "./constants";

/**
 * Checks if the user can start a manual session
 */
export const canStartManualSession = (subscription: string, dailySessionCount: number, balance: number): boolean => {
  const normalizedSubscription = normalizeSubscription(subscription);
  const effectiveSubscription = getEffectiveSubscription(normalizedSubscription);
  
  // Users with Pro trial or higher subscriptions have unlimited sessions
  if (effectiveSubscription !== 'freemium') {
    return balance < SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS];
  }
  
  // Freemium users are limited to 1 manual session per day
  return dailySessionCount < 1 && !checkDailyLimit(balance, subscription);
};
