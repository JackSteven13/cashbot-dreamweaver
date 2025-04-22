
/**
 * Withdrawal utilities for the referral system
 */

// Get withdrawal threshold based on subscription
export const getWithdrawalThreshold = (subscription: string): number => {
  switch (subscription) {
    case 'freemium':
      return 300;
    case 'starter':
      return 600;
    case 'gold':
      return 1200;
    case 'elite':
      return 2500;
    default:
      return 300;
  }
};

// Check if withdrawal is allowed based on subscription and referral count
export const isWithdrawalAllowed = (subscription: string, referralCount: number = 0): boolean => {
  // Freemium users need at least one referral to withdraw
  if (subscription === 'freemium' && referralCount < 1) {
    return false;
  }
  
  return true;
};

// Calculate how many referrals needed to reach withdrawal threshold
export const calculateReferralToReachThreshold = (
  subscription: string, 
  currentBalance: number
): { amountNeeded: number, estimatedReferrals: number } | null => {
  const threshold = getWithdrawalThreshold(subscription);
  
  if (currentBalance >= threshold) {
    return null; // Already reached threshold
  }
  
  const amountNeeded = threshold - currentBalance;
  // Estimate: each referral brings about €50 on average
  const estimatedReferrals = Math.ceil(amountNeeded / 50);
  
  return {
    amountNeeded,
    estimatedReferrals
  };
};

export default {
  getWithdrawalThreshold,
  isWithdrawalAllowed,
  calculateReferralToReachThreshold
};
