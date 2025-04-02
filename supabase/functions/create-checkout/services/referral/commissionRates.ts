
import { supabase } from '../../helpers/supabaseClient.ts';
import { handleError } from '../../utils/errorHandler.ts';
import { withRetry } from '../../utils/retryMechanism.ts';

// Cache for commission rates to reduce database calls
const commissionRateCache = new Map<string, { rate: number, timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

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
    'starter': 0.3, // 30% (was 60%)
    'gold': 0.4,    // 40% (was 80%)
    'elite': 0.5,   // 50% (was 100%)
    'freemium': 0.2 // 20% (was 40%)
  };
  
  return rates[subscription as keyof typeof rates] || 0.2;
}
