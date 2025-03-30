
import { supabase } from '../../helpers/supabaseClient.ts';
import { handleError } from '../../utils/errorHandler.ts';

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
