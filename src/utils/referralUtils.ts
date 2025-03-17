
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

// Get referral code from URL
export const getReferralCodeFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref') || null;
};

// Store referral code in local storage for later use during registration
export const storeReferralCode = (code: string) => {
  localStorage.setItem('referralCode', code);
};

// Retrieve stored referral code
export const getStoredReferralCode = () => {
  return localStorage.getItem('referralCode');
};

// Clear stored referral code
export const clearStoredReferralCode = () => {
  localStorage.removeItem('referralCode');
};

// Validate if a referral code is valid
export const validateReferralCode = async (code: string) => {
  if (!code || code.length < 8) return false;
  
  try {
    // Look for users with id starting with the referral code
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('id', `${code}%`)
      .limit(1);
      
    if (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error in validateReferralCode:', error);
    return false;
  }
};
