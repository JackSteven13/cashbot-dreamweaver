// Subscription plans and their limits
export const SUBSCRIPTION_LIMITS = {
  'freemium': 0.5,
  'pro': 5,
  'visionnaire': 20,
  'alpha': 50
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
