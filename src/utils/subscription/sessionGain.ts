
import { SUBSCRIPTION_LIMITS } from './constants';
import { MANUAL_SESSION_GAIN_PERCENTAGES } from './constants';

/**
 * Calculate gain for a manual session based on subscription type
 */
export const calculateManualSessionGain = (
  subscriptionType: string,
  currentDailyGains: number,
  referralCount: number = 0
): number => {
  // Get the daily limit for the subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[subscriptionType as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculate remaining amount to reach the limit
  const remainingToLimit = dailyLimit - currentDailyGains;
  
  // If almost at limit, return a tiny amount to approach limit without exceeding
  if (remainingToLimit <= 0.02 && remainingToLimit > 0) {
    return parseFloat(remainingToLimit.toFixed(2));
  }
  
  // If already at or above limit, return 0
  if (remainingToLimit <= 0) {
    return 0;
  }
  
  // Get the percentage range for random gain based on subscription
  const gainPercentages = MANUAL_SESSION_GAIN_PERCENTAGES[subscriptionType as keyof typeof MANUAL_SESSION_GAIN_PERCENTAGES] 
    || MANUAL_SESSION_GAIN_PERCENTAGES.freemium;
  
  // Calculate a random percentage within the range
  const randomPercentage = gainPercentages.min + Math.random() * (gainPercentages.max - gainPercentages.min);
  
  // Apply referral bonus (2% per referral up to 20%)
  const referralBonus = Math.min(0.2, (referralCount * 0.02));
  
  // Calculate base gain with randomness
  const baseGain = dailyLimit * randomPercentage;
  
  // Apply referral bonus to increase gain
  const gainWithBonus = baseGain * (1 + referralBonus);
  
  // Make sure we don't exceed the daily limit
  const finalGain = Math.min(gainWithBonus, remainingToLimit);
  
  // Return amount with 2 decimal places
  return Number(Math.max(0, finalGain).toFixed(2));
};

/**
 * Calculate gain for an automated session based on subscription type
 */
export const calculateAutoSessionGain = (
  subscriptionType: string,
  currentDailyGains: number,
  referralCount: number = 0
): number => {
  // Auto sessions generate smaller amounts than manual sessions
  // Get the daily limit for the subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[subscriptionType as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculate remaining amount to reach the limit
  const remainingToLimit = dailyLimit - currentDailyGains;
  
  // If almost at limit, return a tiny amount to approach limit without exceeding
  if (remainingToLimit <= 0.01 && remainingToLimit > 0) {
    return parseFloat(remainingToLimit.toFixed(2));
  }
  
  // If already at or above limit, return 0
  if (remainingToLimit <= 0) {
    return 0;
  }
  
  // Auto sessions are 10-30% smaller than manual sessions
  const autoDiscountFactor = 0.7 + (Math.random() * 0.2); // 70-90% of manual gain
  
  // Base percentages for auto sessions (smaller than manual)
  const baseMin = 0.03;
  const baseMax = 0.08;
  
  // Subscription bonus increases percentage slightly for paid plans
  let subscriptionBonus = 0;
  if (subscriptionType === 'starter') subscriptionBonus = 0.02;
  if (subscriptionType === 'gold') subscriptionBonus = 0.04;
  if (subscriptionType === 'elite') subscriptionBonus = 0.06;
  
  // Calculate final percentage range
  const minPercentage = baseMin + subscriptionBonus;
  const maxPercentage = baseMax + subscriptionBonus;
  
  // Random percentage within range
  const randomPercentage = minPercentage + Math.random() * (maxPercentage - minPercentage);
  
  // Calculate base gain with randomness and auto discount
  const baseGain = dailyLimit * randomPercentage * autoDiscountFactor;
  
  // Apply a smaller referral bonus for auto sessions (1% per referral up to 10%)
  const referralBonus = Math.min(0.1, (referralCount * 0.01));
  const gainWithBonus = baseGain * (1 + referralBonus);
  
  // Make sure we don't exceed the daily limit
  const finalGain = Math.min(gainWithBonus, remainingToLimit);
  
  // Return amount with 2 decimal places
  return Number(Math.max(0, finalGain).toFixed(2));
};

// Add compatibility function that matches the name expected in the imports
export const calculateSessionGain = calculateManualSessionGain;

// Event helper functions to maintain balance consistency
export const announceSessionStart = () => {
  window.dispatchEvent(new CustomEvent('session:start'));
};

export const announceSessionComplete = () => {
  window.dispatchEvent(new CustomEvent('session:complete'));
};

