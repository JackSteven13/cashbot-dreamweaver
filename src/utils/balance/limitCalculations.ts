
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

/**
 * Calculate the prorated price when upgrading from one subscription to another
 * @param currentPrice The price of the current subscription
 * @param newPrice The price of the new subscription
 * @param daysRemaining The number of days remaining in the current subscription
 * @param totalDays The total number of days in a subscription period (default 365)
 * @returns The prorated price
 */
export const calculateProratedPrice = (
  currentPrice: number, 
  newPrice: number, 
  daysRemaining: number, 
  totalDays: number = 365
): number => {
  // Calculate the unused portion of the current subscription as a credit
  const unusedCredit = (currentPrice * daysRemaining) / totalDays;
  
  // The new price minus the credit for unused time
  const proratedPrice = Math.max(0, newPrice - unusedCredit);
  
  // Round to 2 decimal places
  return Math.round(proratedPrice * 100) / 100;
};

/**
 * Format a price for display with currency symbol
 * @param price The price to format
 * @param currency The currency symbol (default €)
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string = '€'): string => {
  return `${price.toFixed(2)}${currency}`;
};

/**
 * Calculate subscription savings compared to monthly pricing
 * @param annualPrice The annual subscription price
 * @param equivalentMonthlyPrice What the monthly price would be
 * @returns The percentage saved
 */
export const calculateSavings = (annualPrice: number, equivalentMonthlyPrice: number): number => {
  const monthlyTotal = equivalentMonthlyPrice * 12;
  const savings = ((monthlyTotal - annualPrice) / monthlyTotal) * 100;
  return Math.round(savings);
};
