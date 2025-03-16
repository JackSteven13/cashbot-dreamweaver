
// Subscription plans and their limits
export const SUBSCRIPTION_LIMITS = {
  'freemium': 0.5,
  'pro': 5,
  'visionnaire': 20,
  'alpha': 50
};

// Base percentages for manual boost sessions
export const MANUAL_SESSION_GAIN_PERCENTAGES = {
  'freemium': { min: 0.10, max: 0.20 },  // 10-20% of daily limit
  'pro': { min: 0.05, max: 0.15 },       // 5-15% of daily limit
  'visionnaire': { min: 0.03, max: 0.10 }, // 3-10% of daily limit
  'alpha': { min: 0.02, max: 0.08 }      // 2-8% of daily limit
};

/**
 * Checks if the user has reached the daily gain limit based on their subscription
 */
export const checkDailyLimit = (balance: number, subscription: string): boolean => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS];
  return balance >= dailyLimit && subscription === 'freemium';
};

/**
 * Checks if the user can start a manual session
 */
export const canStartManualSession = (subscription: string, dailySessionCount: number, balance: number): boolean => {
  // Freemium users are limited to 1 manual session per day
  if (subscription === 'freemium') {
    return dailySessionCount < 1 && !checkDailyLimit(balance, subscription);
  }
  // Other subscriptions don't have session limits, just the daily gain limit
  return !checkDailyLimit(balance, subscription);
};

/**
 * Calculate the gain for a manual session
 * @param subscription User's subscription level
 * @param currentBalance Current user balance
 * @param referralCount Number of active referrals (default 0)
 * @returns The calculated gain amount
 */
export const calculateManualSessionGain = (
  subscription: string, 
  currentBalance: number,
  referralCount: number = 0
): number => {
  // Get daily limit for current subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculate remaining amount before reaching limit
  const remainingAmount = dailyLimit - currentBalance;
  
  // If limit already reached, return 0
  if (remainingAmount <= 0) {
    return 0;
  }
  
  // Get base percentage ranges for this subscription
  const percentages = MANUAL_SESSION_GAIN_PERCENTAGES[subscription as keyof typeof MANUAL_SESSION_GAIN_PERCENTAGES];
  
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
 * @param subscription User's subscription level
 * @param currentBalance Current user balance
 * @param referralCount Number of active referrals (default 0)
 * @returns The calculated gain amount
 */
export const calculateAutoSessionGain = (
  subscription: string, 
  currentBalance: number,
  referralCount: number = 0
): number => {
  // Get daily limit for current subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
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
