
import { supabase } from '../../helpers/supabaseClient.ts';
import { handleError } from '../../utils/errorHandler.ts';
import { withRetry } from '../../utils/retryMechanism.ts';
import { getCommissionRateForUser, invalidateCommissionRateCache } from './commissionRates.ts';

/**
 * Track a referral relationship between users
 * @param referrerId The referrer's user ID
 * @param newUserId The referred user's ID
 * @param planType The subscription plan type
 */
export async function trackReferral(referrerId: string | null, newUserId: string, planType: string) {
  if (!isValidReferral(referrerId, newUserId)) {
    return;
  }
  
  try {
    console.log(`[REFERRAL] Processing referral: ${referrerId} -> ${newUserId} (plan: ${planType})`);
    
    // Check if the referral already exists
    const existingReferral = await findExistingReferral(referrerId, newUserId);
    
    // Get standard commission rate with caching
    const commissionRate = await getCommissionRateForUser(referrerId as string);
    console.log(`[REFERRAL] Commission rate for ${referrerId}: ${commissionRate * 100}%`);
    
    if (existingReferral) {
      await updateExistingReferral(existingReferral.id, planType, commissionRate);
      return;
    }
    
    // Create a new referral with appropriate commission rate
    await createNewReferral(referrerId as string, newUserId, planType, commissionRate);
  } catch (error) {
    handleError(error, "[REFERRAL-ERROR] Error in trackReferral");
  }
}

/**
 * Validate if a referral is valid (not null, not self-referral)
 */
function isValidReferral(referrerId: string | null, newUserId: string): boolean {
  if (!referrerId || !newUserId) {
    console.log(`[REFERRAL] Cannot track referral: missing information`);
    return false;
  }
  
  if (referrerId === newUserId) {
    console.log(`[REFERRAL] Self-referral detected, ignored: ${newUserId}`);
    return false;
  }
  
  return true;
}

/**
 * Find existing referral relationship
 */
async function findExistingReferral(referrerId: string | null, newUserId: string) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('referred_user_id', newUserId)
      .maybeSingle();
    
    if (error) {
      console.error(`[REFERRAL-ERROR] Error checking existing referral:`, error);
    }
    
    if (data) {
      console.log(`[REFERRAL] Found existing referral with ID: ${data.id}`);
    }
    
    return data;
  } catch (error) {
    handleError(error, "[REFERRAL-ERROR] Error searching for existing referral");
    return null;
  }
}

/**
 * Update an existing referral
 */
async function updateExistingReferral(referralId: string, planType: string, commissionRate: number) {
  return withRetry(async () => {
    console.log(`[REFERRAL] Updating existing referral ID: ${referralId} with rate: ${commissionRate * 100}%`);
    
    const { error } = await supabase
      .from('referrals')
      .update({
        status: 'active',
        plan_type: planType,
        commission_rate: commissionRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', referralId);
      
    if (error) {
      console.error(`[REFERRAL-ERROR] Error updating referral:`, error);
      throw error;
    } else {
      console.log(`[REFERRAL] Referral updated successfully with commission rate: ${commissionRate * 100}%`);
    }
  }, 2, 1000);
}

/**
 * Create a new referral
 */
async function createNewReferral(referrerId: string, newUserId: string, planType: string, commissionRate: number) {
  try {
    console.log(`[REFERRAL] Creating new referral: ${referrerId} -> ${newUserId} (plan: ${planType})`);
    
    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_user_id: newUserId,
        plan_type: planType,
        status: 'active',
        commission_rate: commissionRate,
      });
      
    if (error) {
      console.error(`[REFERRAL-ERROR] Error creating referral:`, error);
      
      // Retry once after a short delay with withRetry mechanism
      await withRetry(async () => {
        // Get fresh commission rate on retry in case of transient issues
        invalidateCommissionRateCache(referrerId);
        const retryCommissionRate = await getCommissionRateForUser(referrerId);
        
        console.log(`[REFERRAL] Retrying referral creation with rate: ${retryCommissionRate * 100}%`);
        
        const { error: retryError } = await supabase
          .from('referrals')
          .insert({
            referrer_id: referrerId,
            referred_user_id: newUserId,
            plan_type: planType,
            status: 'active',
            commission_rate: retryCommissionRate,
          });
          
        if (retryError) {
          console.error(`[REFERRAL-ERROR] Failed retry for referral creation:`, retryError);
          throw retryError;
        } else {
          console.log(`[REFERRAL] Referral created successfully on retry with commission rate: ${retryCommissionRate * 100}%`);
        }
      }, 1, 2000);
    } else {
      console.log(`[REFERRAL] Referral created successfully with commission rate: ${commissionRate * 100}%`);
    }
  } catch (error) {
    handleError(error, "[REFERRAL-ERROR] Error creating a new referral");
  }
}
