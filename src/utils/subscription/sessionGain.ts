
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
  
  // Pour les comptes freemium, génération de gains moins aléatoire et plus basse
  if (subscriptionType === 'freemium') {
    // Pour freemium, gain fixe entre 0,10 € et 0,25 €
    let baseGain = 0.10 + Math.random() * 0.15;
    
    // Pour les comptes sans parrainage, réduire encore les gains (ralentissement)
    if (referralCount === 0) {
      baseGain *= 0.6; // Réduction de 40% pour encourager le parrainage
    }
    
    // S'assurer qu'on ne dépasse pas la limite quotidienne
    return Math.min(baseGain, remainingToLimit);
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
  // Get the daily limit for the subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[subscriptionType as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculate remaining amount to reach the limit
  const remainingToLimit = dailyLimit - currentDailyGains;
  
  // If already at or above limit, return 0
  if (remainingToLimit <= 0) {
    return 0;
  }
  
  // For automatic sessions, gains should be smaller than manual sessions
  // Use a smaller percentage of the daily limit
  const minGain = 0.001;
  const maxGain = subscriptionType === 'freemium' ? 0.01 : 0.03;
  
  // Calculate a random gain within the range
  const randomGain = minGain + (Math.random() * (maxGain - minGain));
  
  // Apply referral bonus (1% per referral up to 10%)
  const referralBonus = Math.min(0.1, (referralCount * 0.01));
  
  // Apply the bonus
  const gainWithBonus = randomGain * (1 + referralBonus);
  
  // Make sure we don't exceed the remaining amount
  const finalGain = Math.min(gainWithBonus, remainingToLimit * 0.7);
  
  // Return amount with 3 decimal places for smaller increments
  return Number(Math.max(0, finalGain).toFixed(3));
};
