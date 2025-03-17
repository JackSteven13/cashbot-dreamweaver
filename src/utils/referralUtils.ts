
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Fetch user referrals from the database
export const fetchUserReferrals = async (userId: string) => {
  try {
    const { data: referralsData, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
      
    if (referralsError) {
      console.error("Error fetching referrals:", referralsError);
      return [];
    }
    
    return referralsData || [];
  } catch (error) {
    console.error("Error in fetchUserReferrals:", error);
    return [];
  }
};

// Generate a referral link for the user
export const generateReferralLink = (userId: string) => {
  // Create a shorter referral code using just the first part of the UUID
  const referralCode = userId.substring(0, 8);
  // Return full URL with the referral code
  return `${window.location.origin}?ref=${referralCode}`;
};

// Calculate referral bonus percentage based on number of active referrals
export const calculateReferralBonus = (referralsCount: number) => {
  // 5% bonus per referral, up to 25% maximum
  return Math.min(referralsCount * 5, 25);
};

// Apply referral bonus to a value
export const applyReferralBonus = (value: number, referralsCount: number) => {
  const bonusPercentage = calculateReferralBonus(referralsCount);
  const bonusMultiplier = 1 + (bonusPercentage / 100);
  return value * bonusMultiplier;
};
