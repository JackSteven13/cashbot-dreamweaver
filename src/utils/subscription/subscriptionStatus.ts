
import { SUBSCRIPTION_LIMITS } from './constants';

/**
 * Get the effective subscription type (accounting for trials, etc.)
 */
export const getEffectiveSubscription = (subscription: string): string => {
  // For now, we just return the subscription as is
  // In the future, this could check for trial status or other modifiers
  return subscription;
};

/**
 * Check if daily limit has been reached based on subscription
 */
export const checkDailyLimit = (balance: number, subscription: string): boolean => {
  return balance >= (SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5);
};

/**
 * Check if daily counters should be reset (e.g., at midnight)
 */
export const shouldResetDailyCounters = (lastResetTime: number): boolean => {
  const now = new Date();
  const lastReset = new Date(lastResetTime);
  
  // Reset if last reset was on a different calendar day
  return lastReset.getDate() !== now.getDate() || 
         lastReset.getMonth() !== now.getMonth() ||
         lastReset.getFullYear() !== now.getFullYear();
};

// Re-export necessary constants
export { SUBSCRIPTION_LIMITS };
