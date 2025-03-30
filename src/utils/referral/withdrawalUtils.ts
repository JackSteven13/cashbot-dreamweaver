
/**
 * Calculate withdrawal fee based on account age
 * @param accountCreationDate Date account was created
 * @returns Fee percentage as decimal (0.5 for accounts less than 6 months old, 0 otherwise)
 */
export const calculateWithdrawalFee = (accountCreationDate: Date): number => {
  const now = new Date();
  const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000; // Approximate 6 months in milliseconds
  const accountAgeMs = now.getTime() - accountCreationDate.getTime();
  
  // Apply 50% fee if account is less than 6 months old
  return accountAgeMs < sixMonthsInMs ? 0.5 : 0;
};

/**
 * Get withdrawal threshold based on subscription
 * @param subscription User subscription level
 * @returns Minimum withdrawal amount in currency units
 */
export const getWithdrawalThreshold = (subscription: string): number => {
  const thresholds = {
    'freemium': 200,
    'starter': 400,
    'gold': 700,
    'elite': 1000
  };
  
  return thresholds[subscription as keyof typeof thresholds] || 200;
};
