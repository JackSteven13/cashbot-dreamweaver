
/**
 * Withdrawal utilities for the referral system
 */

// Withdrawal threshold constants for each subscription level
export const WITHDRAWAL_THRESHOLDS = {
  'freemium': 300,     // 300€ minimum
  'starter': 600,      // 600€ minimum
  'gold': 1200,        // 1200€ minimum
  'elite': 2500        // 2500€ minimum
};

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

// Calculate withdrawal fee based on registration date and subscription
export const calculateWithdrawalFee = (registerDate: Date, subscription: string): number => {
  const now = new Date();
  const accountAge = now.getTime() - registerDate.getTime();
  const daysActive = Math.floor(accountAge / (1000 * 60 * 60 * 24));
  
  // Base fee depends on subscription level
  let baseFee = 0.05; // 5% for freemium
  
  switch (subscription) {
    case 'starter':
      baseFee = 0.04; // 4% for starter
      break;
    case 'gold':
      baseFee = 0.03; // 3% for gold
      break;
    case 'elite':
      baseFee = 0.02; // 2% for elite
      break;
  }
  
  // Reduce fee for accounts older than 30 days
  if (daysActive > 30) {
    baseFee = Math.max(0.01, baseFee - 0.01);
  }
  
  // Further reduce fee for accounts older than 90 days
  if (daysActive > 90) {
    baseFee = Math.max(0.01, baseFee - 0.01);
  }
  
  return baseFee;
};

// Calculate progress percentage towards withdrawal threshold
export const getWithdrawalProgress = (balance: number, subscription: string): number => {
  const threshold = getWithdrawalThreshold(subscription);
  if (threshold <= 0) return 100;
  
  const progress = (balance / threshold) * 100;
  return Math.min(100, Math.max(0, progress));
};

// Check if user can withdraw based on balance and subscription
export const canWithdraw = (balance: number, subscription: string, referralCount: number = 0): boolean => {
  const threshold = getWithdrawalThreshold(subscription);
  
  // Check if balance meets threshold and account has necessary referrals
  return balance >= threshold && isWithdrawalAllowed(subscription, referralCount);
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
  WITHDRAWAL_THRESHOLDS,
  getWithdrawalThreshold,
  isWithdrawalAllowed,
  calculateWithdrawalFee,
  getWithdrawalProgress,
  canWithdraw,
  calculateReferralToReachThreshold
};
