
import { COMMISSION_RATES } from "@/components/dashboard/summary/constants";
import { supabase } from "@/integrations/supabase/client";

/**
 * Calculate referral bonus percentage based on number of active referrals
 * @param referralsCount Number of active referrals
 * @returns Bonus percentage as integer
 */
export const calculateReferralBonus = (referralsCount: number) => {
  if (referralsCount <= 0) return 0;
  
  // 5% bonus per referral, up to 25% maximum
  const bonus = Math.min(referralsCount * 5, 25);
  
  // Return as integer for cleaner UI display
  return Math.floor(bonus);
};

/**
 * Get commission rate based on subscription type
 * @param subscription User subscription level
 * @returns Commission rate as decimal
 */
export const getCommissionRate = (subscription: string) => {
  return COMMISSION_RATES[subscription as keyof typeof COMMISSION_RATES] || 0.4; // Default to freemium (40%)
};

/**
 * Apply referral bonus to a value
 * @param value Base value to apply bonus to
 * @param referralsCount Number of referrals
 * @returns Value with bonus applied
 */
export const applyReferralBonus = (value: number, referralsCount: number) => {
  const bonusPercentage = calculateReferralBonus(referralsCount);
  const bonusMultiplier = 1 + (bonusPercentage / 100);
  return value * bonusMultiplier;
};

/**
 * Get the user's commission information for display purposes
 * @param userId User ID to check
 * @returns Object with rate and subscription information
 */
export const getUserCommissionInfo = async (userId: string) => {
  try {
    // Get the user's subscription first
    const { data: userData, error: userError } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error('Error getting user subscription:', userError);
      return {
        rate: 0.4, // Default to freemium rate
        subscription: 'freemium'
      };
    }
    
    // Return the commission rate based on subscription
    const subscription = userData.subscription;
    return {
      rate: COMMISSION_RATES[subscription as keyof typeof COMMISSION_RATES] || 0.4,
      subscription: subscription
    };
  } catch (error) {
    console.error('Error in getUserCommissionInfo:', error);
    return {
      rate: 0.4, // Default in case of error
      subscription: 'freemium'
    };
  }
};
