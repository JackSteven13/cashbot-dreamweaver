
import { supabase } from '../helpers/supabaseClient.ts';

// Find referrer from referral code
export async function findReferrer(referralCode: string | null) {
  if (!referralCode) return null;
  
  try {
    // Extract user ID from referral code (assuming format like "userId_abc123")
    const userId = referralCode.split('_')[0];
    if (!userId) return null;
    
    // Look up the user in the database
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (error || !data) {
      console.error("Error finding referrer:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Error processing referral code:", error);
    return null;
  }
}

// Function to track a referral
export async function trackReferral(referrerId: string | null, newUserId: string, planType: string) {
  if (!referrerId || !newUserId) return;
  
  try {
    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_user_id: newUserId,
        plan_type: planType,
        status: 'active',
      });
      
    if (error) {
      console.error("Error tracking referral:", error);
    } else {
      console.log(`Referral tracked: ${referrerId} referred ${newUserId}`);
    }
  } catch (error) {
    console.error("Error in trackReferral:", error);
  }
}
