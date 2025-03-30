
import { supabase } from '../../helpers/supabaseClient.ts';
import { handleError } from '../../utils/errorHandler.ts';

/**
 * Get referrals for a specific user
 * @param userId The user ID to get referrals for
 * @returns Array of referrals
 */
export async function getReferralsForUser(userId: string) {
  try {
    console.log(`[REFERRAL] Fetching referrals for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(`[REFERRAL-ERROR] Error fetching referrals:`, error);
      return [];
    }
    
    console.log(`[REFERRAL] Found ${data?.length || 0} referrals for user: ${userId}`);
    return data || [];
  } catch (error) {
    handleError(error, "[REFERRAL-ERROR] Error in getReferralsForUser");
    return [];
  }
}

/**
 * Get referral statistics for a user
 * @param userId The user ID to get statistics for
 * @returns Object with referral statistics
 */
export async function getReferralStats(userId: string) {
  try {
    console.log(`[REFERRAL] Fetching referral statistics for user: ${userId}`);
    
    // Get count of active referrals
    const { count: activeCount, error: countError } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', userId)
      .eq('status', 'active');
      
    if (countError) {
      console.error(`[REFERRAL-ERROR] Error fetching referral count:`, countError);
      return { activeReferrals: 0, totalReferrals: 0 };
    }
    
    // Get total referrals count
    const { count: totalCount, error: totalError } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', userId);
      
    if (totalError) {
      console.error(`[REFERRAL-ERROR] Error fetching total referral count:`, totalError);
      return { activeReferrals: activeCount || 0, totalReferrals: 0 };
    }
    
    return { 
      activeReferrals: activeCount || 0, 
      totalReferrals: totalCount || 0 
    };
  } catch (error) {
    handleError(error, "[REFERRAL-ERROR] Error in getReferralStats");
    return { activeReferrals: 0, totalReferrals: 0 };
  }
}
