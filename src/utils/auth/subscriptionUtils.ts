
/**
 * Checks if a user is at their daily limit based on subscription and balance
 */
export const checkDailyLimit = (balance: number, subscription: string) => {
  // Import this from subscriptionUtils if needed
  const SUBSCRIPTION_LIMITS: Record<string, number> = {
    'freemium': 1,
    'starter': 7,
    'gold': 25,
    'elite': 75
  };
  
  return balance >= (SUBSCRIPTION_LIMITS[subscription] || 1);
};
