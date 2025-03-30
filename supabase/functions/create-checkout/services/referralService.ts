
import { supabase } from '../helpers/supabaseClient.ts';
import { handleError } from '../utils/errorHandler.ts';
import { withRetry } from '../utils/retryMechanism.ts';

// Cache for commission rates to reduce database calls
const commissionRateCache = new Map<string, { rate: number, timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Find referrer based on a referral code using multiple search strategies
 * @param referralCode The referral code to search for
 * @returns The referrer's user ID or null if not found
 */
export async function findReferrer(referralCode: string | null) {
  if (!referralCode) return null;
  
  try {
    console.log(`[REFERRAL] Searching for referrer with code: ${referralCode}`);
    
    // Strategy 1: Direct UUID match if referral code is a UUID
    if (isUuidLike(referralCode)) {
      console.log(`[REFERRAL] Code appears to be UUID-like, trying direct match`);
      const directMatch = await findReferrerByDirectUuid(referralCode);
      if (directMatch) return directMatch;
    }
    
    // Strategy 2: Try to extract and match userId part
    const uuidPart = extractUuidPart(referralCode);
    if (uuidPart) {
      console.log(`[REFERRAL] Extracted UUID part: ${uuidPart}, trying partial match`);
      const partialMatch = await findReferrerByPartialUuid(uuidPart);
      if (partialMatch) return partialMatch;
    }
    
    // Strategy 3: Use custom function to search in database
    console.log(`[REFERRAL] Trying specialized RPC function search`);
    const rpcMatch = await findReferrerByRpc(referralCode);
    if (rpcMatch) return rpcMatch;
    
    console.log(`[REFERRAL] No referrer found for code: ${referralCode}`);
    return null;
  } catch (error) {
    console.error(`[REFERRAL-ERROR] Error processing referral code:`, error);
    return null;
  }
}

/**
 * Check if a string looks like a UUID
 */
function isUuidLike(str: string): boolean {
  return str.length >= 32 && str.includes('-');
}

/**
 * Extract potential UUID part from a referral code
 */
function extractUuidPart(referralCode: string): string | null {
  const parts = referralCode.split('_');
  return parts[0] && parts[0].length >= 8 ? parts[0] : null;
}

/**
 * Find referrer by direct UUID match
 */
async function findReferrerByDirectUuid(uuid: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', uuid)
      .single();
      
    if (!error && data) {
      console.log(`[REFERRAL] Found referrer by direct UUID match: ${data.id}`);
      return data.id;
    }
    
    return null;
  } catch (error) {
    console.error(`[REFERRAL-ERROR] Error in direct UUID search:`, error);
    return null;
  }
}

/**
 * Find referrer by partial UUID match
 */
async function findReferrerByPartialUuid(uuidPart: string): Promise<string | null> {
  try {
    // Exact match first
    const { data: matchWithPrefix, error: prefixError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', uuidPart)
      .maybeSingle();
      
    if (!prefixError && matchWithPrefix) {
      console.log(`[REFERRAL] Found referrer by exact UUID part: ${matchWithPrefix.id}`);
      return matchWithPrefix.id;
    }
    
    // Partial match as fallback
    const { data: matchWithPartial, error: partialError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('id', `${uuidPart}%`)
      .limit(1);
      
    if (!partialError && matchWithPartial && matchWithPartial.length > 0) {
      console.log(`[REFERRAL] Found referrer by partial UUID match: ${matchWithPartial[0].id}`);
      return matchWithPartial[0].id;
    }
    
    console.log(`[REFERRAL] No matches found for UUID part: ${uuidPart}`);
    return null;
  } catch (error) {
    console.error(`[REFERRAL-ERROR] Error in partial UUID search:`, error);
    return null;
  }
}

/**
 * Find referrer using the database RPC function
 */
async function findReferrerByRpc(referralCode: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .rpc('find_referrer_by_code', { code: referralCode });
      
    if (!error && data) {
      console.log(`[REFERRAL] Found referrer via specialized RPC: ${data}`);
      return data;
    }
    
    return null;
  } catch (error) {
    console.error(`[REFERRAL-ERROR] Error in RPC search:`, error);
    return null;
  }
}

/**
 * Check if cached commission rate is valid or expired
 * @param cacheEntry The cache entry to check
 * @returns Boolean indicating if cache entry is valid
 */
function isCacheValid(cacheEntry: { rate: number, timestamp: number } | undefined): boolean {
  if (!cacheEntry) return false;
  
  const now = Date.now();
  return (now - cacheEntry.timestamp) < CACHE_TTL_MS;
}

/**
 * Get commission rate based on user's subscription
 * @param referrerId The referrer's user ID
 * @returns The commission rate as a decimal (0.4 to 1.0)
 */
export async function getCommissionRateForUser(referrerId: string): Promise<number> {
  try {
    // Check cache first
    const cacheKey = `commission_${referrerId}`;
    const cachedRate = commissionRateCache.get(cacheKey);
    
    if (isCacheValid(cachedRate)) {
      console.log(`[REFERRAL] Using cached commission rate for ${referrerId}: ${cachedRate!.rate}`);
      return cachedRate!.rate;
    }
    
    console.log(`[REFERRAL] Fetching commission rate from database for user: ${referrerId}`);
    
    return await withRetry(async () => {
      // Get the user's subscription
      const { data: userData, error: userError } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', referrerId)
        .maybeSingle();
        
      if (userError) {
        console.error(`[REFERRAL-ERROR] Error fetching subscription:`, userError);
        return 0.4; // Default to freemium rate (40%)
      }
      
      if (!userData) {
        console.warn(`[REFERRAL] No user balance found for ${referrerId}, using default rate`);
        return 0.4;
      }
      
      // Calculate rate based on subscription
      const rate = getCommissionRateBySubscription(userData.subscription);
      
      // Cache the result
      commissionRateCache.set(cacheKey, { 
        rate, 
        timestamp: Date.now() 
      });
      
      console.log(`[REFERRAL] Commission rate for ${referrerId} (${userData.subscription}): ${rate * 100}%`);
      return rate;
    }, 3, 1000);
  } catch (error) {
    console.error(`[REFERRAL-ERROR] Error getting commission rate:`, error);
    return 0.4; // Default to freemium rate (40%)
  }
}

/**
 * Invalidate commission rate cache for a specific user
 * @param userId The user ID to invalidate cache for
 */
export function invalidateCommissionRateCache(userId: string): void {
  const cacheKey = `commission_${userId}`;
  if (commissionRateCache.has(cacheKey)) {
    console.log(`[REFERRAL] Invalidating commission rate cache for user: ${userId}`);
    commissionRateCache.delete(cacheKey);
  }
}

/**
 * Get commission rate based on subscription type
 */
function getCommissionRateBySubscription(subscription: string): number {
  const rates = {
    'starter': 0.6, // 60%
    'gold': 0.8,    // 80%
    'elite': 1.0,   // 100%
    'freemium': 0.4 // 40%
  };
  
  return rates[subscription as keyof typeof rates] || 0.4;
}

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
