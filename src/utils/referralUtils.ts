
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { COMMISSION_RATES } from "@/components/dashboard/summary/constants";

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
  if (referralsCount <= 0) return 0;
  
  // 5% bonus per referral, up to 25% maximum
  const bonus = Math.min(referralsCount * 5, 25);
  
  // Return as integer for cleaner UI display
  return Math.floor(bonus);
};

// Get commission rate based on subscription type
export const getCommissionRate = (subscription: string) => {
  return COMMISSION_RATES[subscription as keyof typeof COMMISSION_RATES] || 0.4; // Default to freemium (40%)
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

// Get the user's commission information (helper function to display correct information)
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

// Calculate withdrawal fee based on account age (if withdrawn before 6 months, 50% fee applies)
export const calculateWithdrawalFee = (accountCreationDate: Date): number => {
  const now = new Date();
  const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000; // Approximate 6 months in milliseconds
  const accountAgeMs = now.getTime() - accountCreationDate.getTime();
  
  // Apply 50% fee if account is less than 6 months old
  return accountAgeMs < sixMonthsInMs ? 0.5 : 0;
};

// Get withdrawal threshold based on subscription
export const getWithdrawalThreshold = (subscription: string): number => {
  const thresholds = {
    'freemium': 200,
    'starter': 400,
    'gold': 700,
    'elite': 1000
  };
  
  return thresholds[subscription as keyof typeof thresholds] || 200;
};
