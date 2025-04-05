
import { supabase } from "@/integrations/supabase/client";

/**
 * Validate if a referral code is valid by checking against the referral_codes table
 * @param code Referral code to validate
 * @returns Boolean indicating if code is valid
 */
export const validateReferralCode = async (code: string) => {
  if (!code || code.length !== 8) return false;
  
  // Le code admin est toujours valide
  if (code === '87878787') return true;
  
  try {
    // Nous ne pouvons pas utiliser le typesafety pour cette table spécifique
    // car elle n'est pas encore dans les types générés
    const { data, error } = await supabase
      .from('referral_codes')
      .select('id, owner_id, is_active')
      .eq('code', code)
      .single();
      
    if (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
    
    return data && data.is_active === true;
  } catch (error) {
    console.error('Error in validateReferralCode:', error);
    return false;
  }
};

/**
 * Get referrer ID from referral code
 * @param code Referral code
 * @returns Referrer user ID or null if invalid
 */
export const getReferrerIdFromCode = async (code: string) => {
  if (!code || code.length !== 8) return null;
  
  // Le code admin n'a pas de referrer
  if (code === '87878787') return null;
  
  try {
    // Contourner le typesafety pour cette requête spécifique
    const { data, error } = await supabase
      .from('referral_codes')
      .select('owner_id')
      .eq('code', code)
      .single();
      
    if (error || !data) {
      console.error('Error getting referrer from code:', error);
      return null;
    }
    
    return data.owner_id;
  } catch (error) {
    console.error('Error in getReferrerIdFromCode:', error);
    return null;
  }
};
