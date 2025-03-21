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
 * Vérifie le mode Pro temporaire et retourne la souscription effective
 */
export const getEffectiveSubscription = (subscription: string): string => {
  const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
  const proTrialExpires = localStorage.getItem('proTrialExpires');
  
  if (proTrialActive && proTrialExpires) {
    const expiryTime = parseInt(proTrialExpires, 10);
    const now = Date.now();
    
    // Vérification stricte de l'expiration
    if (now < expiryTime) {
      return 'pro';
    } else {
      // Si expiré, nettoyer le localStorage et marquer comme utilisé
      console.log("Essai Pro expiré. Nettoyage des données d'essai.");
      localStorage.removeItem('proTrialActive');
      localStorage.removeItem('proTrialExpires');
      localStorage.setItem('proTrialUsed', 'true');
    }
  }
  
  return subscription;
};

/**
 * Checks if the user has reached the daily gain limit based on their subscription
 */
export const checkDailyLimit = (balance: number, subscription: string): boolean => {
  const effectiveSubscription = getEffectiveSubscription(subscription);
  const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  return balance >= dailyLimit;
};

/**
 * Checks if the user can start a manual session
 */
export const canStartManualSession = (subscription: string, dailySessionCount: number, balance: number): boolean => {
  const effectiveSubscription = getEffectiveSubscription(subscription);
  
  // Users with Pro trial or higher subscriptions have unlimited sessions
  if (effectiveSubscription !== 'freemium') {
    return balance < SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS];
  }
  
  // Freemium users are limited to 1 manual session per day
  return dailySessionCount < 1 && !checkDailyLimit(balance, subscription);
};

/**
 * Calculate the gain for a manual session
 */
export const calculateManualSessionGain = (
  subscription: string, 
  currentBalance: number,
  referralCount: number = 0
): number => {
  // Use effective subscription for limit calculation
  const effectiveSubscription = getEffectiveSubscription(subscription);
  
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
  // Use effective subscription for limit calculation
  const effectiveSubscription = getEffectiveSubscription(subscription);
  
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
