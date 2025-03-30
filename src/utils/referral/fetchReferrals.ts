
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch user referrals from the database
 * @param userId User ID to fetch referrals for
 * @returns Array of referrals or empty array if error
 */
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
