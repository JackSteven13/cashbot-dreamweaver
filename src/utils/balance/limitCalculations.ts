
/**
 * Calculate the percentage of the daily limit reached
 * @param currentBalance The current user balance
 * @param dailyLimit The daily limit for the user's subscription
 * @returns The percentage (0-100) of the limit reached
 */
export const calculateLimitPercentage = (currentBalance: number, dailyLimit: number): number => {
  if (!dailyLimit || dailyLimit <= 0) return 0;
  const percentage = (currentBalance / dailyLimit) * 100;
  return Math.min(100, Math.max(0, percentage)); // Ensure percentage is between 0 and 100
};

/**
 * Check if the user's balance has reached the daily limit
 * @param currentBalance The current user balance
 * @param dailyLimit The daily limit for the user's subscription
 * @returns Boolean indicating if limit is reached
 */
export const isLimitReached = (currentBalance: number, dailyLimit: number): boolean => {
  return currentBalance >= dailyLimit;
};

/**
 * Calculate the remaining balance before hitting the daily limit
 * @param currentBalance The current user balance
 * @param dailyLimit The daily limit for the user's subscription
 * @returns The remaining balance before hitting the limit
 */
export const calculateRemainingBalance = (currentBalance: number, dailyLimit: number): number => {
  const remaining = dailyLimit - currentBalance;
  return Math.max(0, remaining);
};
