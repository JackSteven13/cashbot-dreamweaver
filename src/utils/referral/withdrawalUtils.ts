
import { WITHDRAWAL_FEES, WITHDRAWAL_THRESHOLDS } from '@/utils/subscription/constants';

/**
 * Calculate withdrawal fee based on account age and subscription
 * @param accountCreationDate Date account was created
 * @param subscription User's subscription level
 * @returns Fee percentage as decimal (higher for newer accounts and lower tier subscriptions)
 */
export const calculateWithdrawalFee = (accountCreationDate: Date, subscription: string): number => {
  const now = new Date();
  const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000; // Approximate 6 months in milliseconds
  const accountAgeMs = now.getTime() - accountCreationDate.getTime();
  
  // Check if account is less than 6 months old
  const isEarlyAccount = accountAgeMs < sixMonthsInMs;
  
  // Get fee structure based on account age
  const feeStructure = isEarlyAccount 
    ? WITHDRAWAL_FEES.earlyAccount 
    : WITHDRAWAL_FEES.matureAccount;
    
  // Apply fee based on subscription level
  return feeStructure[subscription as keyof typeof feeStructure] || 0.5;
};

/**
 * Get withdrawal threshold based on subscription
 * @param subscription User subscription level
 * @returns Minimum withdrawal amount in currency units
 */
export const getWithdrawalThreshold = (subscription: string): number => {
  // For freemium accounts, return the threshold from constants
  return WITHDRAWAL_THRESHOLDS[subscription as keyof typeof WITHDRAWAL_THRESHOLDS] || 100;
};

/**
 * Check if withdrawal is allowed based on subscription and referrals
 * @param subscription User subscription level
 * @param referralCount Number of referrals the user has
 * @returns Boolean indicating if withdrawals are allowed
 */
export const isWithdrawalAllowed = (subscription: string, referralCount: number = 0): boolean => {
  // Freemium users can withdraw ONLY if they have at least one referral
  if (subscription === 'freemium') {
    return referralCount > 0;
  }
  
  // Paid users can always withdraw
  return true;
};
