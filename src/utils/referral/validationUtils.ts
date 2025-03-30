
import { supabase } from "@/integrations/supabase/client";

/**
 * Validate if a referral code is valid by checking against user IDs
 * @param code Referral code to validate
 * @returns Boolean indicating if code is valid
 */
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
