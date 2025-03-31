
import { normalizeSubscription, getEffectiveSubscription } from "./subscriptionStatus";
import { SUBSCRIPTION_LIMITS, MANUAL_SESSION_GAIN_PERCENTAGES } from "./constants";

/**
 * Calculate the gain for a manual session
 */
export const calculateManualSessionGain = (
  subscription: string, 
  currentBalance: number,
  referralCount: number = 0
): number => {
  // Normalize subscription first
  const normalizedSubscription = normalizeSubscription(subscription);
  
  // Use effective subscription for limit calculation
  const effectiveSubscription = getEffectiveSubscription(normalizedSubscription);
  
  // Get daily limit for effective subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculate remaining amount before reaching limit
  const remainingAmount = dailyLimit - currentBalance;
  
  // If limit already reached, return 0
  if (remainingAmount <= 0) {
    return 0;
  }
  
  // Get base percentage ranges for this subscription
  const percentages = MANUAL_SESSION_GAIN_PERCENTAGES[effectiveSubscription as keyof typeof MANUAL_SESSION_GAIN_PERCENTAGES];
  
  // Base gain is a percentage of the subscription's daily limit
  const minPercentage = percentages.min;
  const maxPercentage = percentages.max;
  
  // Random percentage within the range
  const randomPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
  
  // Calculate base gain
  let gain = dailyLimit * randomPercentage;
  
  // Referral bonus: each referral adds a small percentage (0.5-2%) to the gain, up to 25% extra
  if (referralCount > 0) {
    const referralBonus = Math.min(referralCount * 0.05, 0.25); // Max 25% bonus
    gain = gain * (1 + referralBonus);
  }
  
  // Ensure gain doesn't exceed remaining amount
  gain = Math.min(gain, remainingAmount);
  
  // Round to 2 decimal places and ensure positive
  return parseFloat(Math.max(0.01, gain).toFixed(2));
};

/**
 * Calculate the gain for an automatic session
 */
export const calculateAutoSessionGain = (
  subscription: string, 
  currentBalance: number,
  referralCount: number = 0
): number => {
  // Normalize subscription first
  const normalizedSubscription = normalizeSubscription(subscription);
  
  // Use effective subscription for limit calculation
  const effectiveSubscription = getEffectiveSubscription(normalizedSubscription);
  
  // Get daily limit for effective subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculate remaining amount before reaching limit
  const remainingAmount = dailyLimit - currentBalance;
  
  // If limit already reached, return 0
  if (remainingAmount <= 0) {
    return 0;
  }
  
  // Auto sessions generate smaller gains than manual sessions
  // They are 10-30% of the manual session gains
  const minPercentage = 0.01;  // Min 1% of daily limit
  const maxPercentage = 0.03;  // Max 3% of daily limit
  
  // Random percentage within the range
  const randomPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
  
  // Calculate base gain
  let gain = dailyLimit * randomPercentage;
  
  // Referral bonus: each referral adds a small percentage to the gain
  if (referralCount > 0) {
    const referralBonus = Math.min(referralCount * 0.02, 0.15); // Max 15% bonus
    gain = gain * (1 + referralBonus);
  }
  
  // Ensure gain doesn't exceed remaining amount
  gain = Math.min(gain, remainingAmount);
  
  // Round to 2 decimal places and ensure positive
  return parseFloat(Math.max(0.01, gain).toFixed(2));
};
