
import { SUBSCRIPTION_LIMITS } from './constants';

/**
 * Get the effective subscription type (accounting for trials, etc.)
 */
export const getEffectiveSubscription = (subscription: string): string => {
  // For now, we just return the subscription as is
  // In the future, this could check for trial status or other modifiers
  return subscription || 'freemium';
};

/**
 * Check if daily limit has been reached based on subscription
 * This checks if the DAILY limit has been reached, not the total balance
 */
export const checkDailyLimit = (dailyGain: number, subscription: string): boolean => {
  const limit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  return dailyGain >= limit * 0.98; // 98% de la limite pour être préventif
};

/**
 * Check if daily counters should be reset (e.g., at midnight)
 * @param lastResetTime Timestamp of the last reset
 */
export const shouldResetDailyCounters = (lastResetTime: number): boolean => {
  const now = new Date();
  const lastReset = new Date(lastResetTime);
  
  // Reset if last reset was on a different calendar day
  return lastReset.getDate() !== now.getDate() || 
         lastReset.getMonth() !== now.getMonth() ||
         lastReset.getFullYear() !== now.getFullYear();
}
