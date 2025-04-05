
import { UserData } from "@/types/userData";
import { COMMISSION_RATES, RECURRING_COMMISSION_RATES, LEVEL2_COMMISSION_RATES } from '@/components/dashboard/summary/constants';

/**
 * Calculate referral bonus based on subscription and referred user's plan
 */
export const calculateReferralBonus = (
  subscription: string,
  referredUserPlan: string,
  referredUserAmount: number
): number => {
  // Get commission rate based on user's subscription
  const commissionRate = COMMISSION_RATES[subscription as keyof typeof COMMISSION_RATES] || 0.2;
  
  // Calculate bonus amount
  const bonusAmount = referredUserAmount * commissionRate;
  
  return parseFloat(bonusAmount.toFixed(2));
};

/**
 * Get commission rate for a given subscription type
 */
export const getCommissionRate = (subscription: string): number => {
  return COMMISSION_RATES[subscription as keyof typeof COMMISSION_RATES] || 0.2;
};

/**
 * Apply referral bonus to user's balance
 */
export const applyReferralBonus = (userData: UserData, amount: number): UserData => {
  return {
    ...userData,
    balance: userData.balance + amount,
    totalEarnings: (userData.totalEarnings || 0) + amount
  };
};

/**
 * Get user commission information including direct, recurring and level 2 rates
 */
export const getUserCommissionInfo = (subscription: string) => {
  return {
    directCommission: COMMISSION_RATES[subscription as keyof typeof COMMISSION_RATES] || 0.2,
    recurringCommission: RECURRING_COMMISSION_RATES[subscription as keyof typeof RECURRING_COMMISSION_RATES] || 0,
    level2Commission: LEVEL2_COMMISSION_RATES[subscription as keyof typeof LEVEL2_COMMISSION_RATES] || 0
  };
};
