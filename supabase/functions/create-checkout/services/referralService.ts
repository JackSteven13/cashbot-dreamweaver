
import { supabase } from '../helpers/supabaseClient.ts';
import { handleError } from '../utils/errorHandler.ts';
import { withRetry } from '../utils/retryMechanism.ts';

/**
 * Find referrer based on a referral code using multiple search strategies
 * @param referralCode The referral code to search for
 * @returns The referrer's user ID or null if not found
 */
export async function findReferrer(referralCode: string | null) {
  if (!referralCode) return null;
  
  try {
    console.log("Recherche du parrain pour le code:", referralCode);
    
    // Strategy 1: Direct UUID match if referral code is a UUID
    if (isUuidLike(referralCode)) {
      const directMatch = await findReferrerByDirectUuid(referralCode);
      if (directMatch) return directMatch;
    }
    
    // Strategy 2: Try to extract and match userId part
    const uuidPart = extractUuidPart(referralCode);
    if (uuidPart) {
      const partialMatch = await findReferrerByPartialUuid(uuidPart);
      if (partialMatch) return partialMatch;
    }
    
    // Strategy 3: Use custom function to search in database
    const rpcMatch = await findReferrerByRpc(referralCode);
    if (rpcMatch) return rpcMatch;
    
    console.log("Aucun parrain trouvé pour le code:", referralCode);
    return null;
  } catch (error) {
    console.error("Erreur lors du traitement du code de parrainage:", error);
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
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', uuid)
    .single();
    
  if (!error && data) {
    console.log("Parrain trouvé par correspondance UUID directe:", data.id);
    return data.id;
  }
  
  return null;
}

/**
 * Find referrer by partial UUID match
 */
async function findReferrerByPartialUuid(uuidPart: string): Promise<string | null> {
  // Exact match first
  const { data: matchWithPrefix, error: prefixError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', uuidPart)
    .maybeSingle();
    
  if (!prefixError && matchWithPrefix) {
    console.log("Parrain trouvé par partie UUID exacte:", matchWithPrefix.id);
    return matchWithPrefix.id;
  }
  
  // Partial match as fallback
  const { data: matchWithPartial, error: partialError } = await supabase
    .from('profiles')
    .select('id')
    .ilike('id', `${uuidPart}%`)
    .limit(1);
    
  if (!partialError && matchWithPartial && matchWithPartial.length > 0) {
    console.log("Parrain trouvé par UUID partiel:", matchWithPartial[0].id);
    return matchWithPartial[0].id;
  }
  
  return null;
}

/**
 * Find referrer using the database RPC function
 */
async function findReferrerByRpc(referralCode: string): Promise<string | null> {
  const { data, error } = await supabase
    .rpc('find_referrer_by_code', { code: referralCode });
    
  if (!error && data) {
    console.log("Parrain trouvé via RPC spécialisée:", data);
    return data;
  }
  
  return null;
}

/**
 * Get commission rate based on user's subscription
 * @param referrerId The referrer's user ID
 * @returns The commission rate as a decimal (0.4 to 1.0)
 */
export async function getCommissionRateForUser(referrerId: string): Promise<number> {
  try {
    return await withRetry(async () => {
      // Get the user's subscription
      const { data: userData, error: userError } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', referrerId)
        .maybeSingle();
        
      if (userError || !userData) {
        console.error("Erreur lors de la récupération de l'abonnement:", userError);
        return 0.4; // Default to freemium rate (40%)
      }
      
      // Return commission rate based on subscription
      return getCommissionRateBySubscription(userData.subscription);
    }, 3, 1000);
  } catch (error) {
    console.error("Erreur lors de la récupération du taux de commission:", error);
    return 0.4; // Default to freemium rate (40%)
  }
}

/**
 * Get commission rate based on subscription type
 */
function getCommissionRateBySubscription(subscription: string): number {
  switch (subscription) {
    case 'starter':
      return 0.6; // 60%
    case 'gold':
      return 0.8; // 80%
    case 'elite':
      return 1.0; // 100%
    default:
      return 0.4; // 40% for freemium
  }
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
    // Check if the referral already exists
    const existingReferral = await findExistingReferral(referrerId, newUserId);
    
    // Get standard commission rate
    const commissionRate = await getCommissionRateForUser(referrerId as string);
    console.log(`Taux de commission pour ${referrerId}: ${commissionRate * 100}%`);
    
    if (existingReferral) {
      await updateExistingReferral(existingReferral.id, planType, commissionRate);
      return;
    }
    
    // Create a new referral with appropriate commission rate
    await createNewReferral(referrerId as string, newUserId, planType, commissionRate);
  } catch (error) {
    handleError(error, "Erreur dans trackReferral");
  }
}

/**
 * Validate if a referral is valid (not null, not self-referral)
 */
function isValidReferral(referrerId: string | null, newUserId: string): boolean {
  if (!referrerId || !newUserId) {
    console.log("Impossible de suivre le parrainage : informations manquantes");
    return false;
  }
  
  if (referrerId === newUserId) {
    console.log("Auto-parrainage détecté, ignoré");
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
      console.error("Erreur lors de la vérification du parrainage existant:", error);
    }
    
    return data;
  } catch (error) {
    handleError(error, "Erreur lors de la recherche d'un parrainage existant");
    return null;
  }
}

/**
 * Update an existing referral
 */
async function updateExistingReferral(referralId: string, planType: string, commissionRate: number) {
  return withRetry(async () => {
    console.log("Ce parrainage existe déjà, mise à jour du statut si nécessaire");
    
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
      console.error("Erreur lors de la mise à jour du parrainage:", error);
      throw error;
    } else {
      console.log(`Parrainage mis à jour avec un taux de commission de ${commissionRate * 100}%`);
    }
  }, 2, 1000);
}

/**
 * Create a new referral
 */
async function createNewReferral(referrerId: string, newUserId: string, planType: string, commissionRate: number) {
  try {
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
      console.error("Erreur lors de l'enregistrement du parrainage:", error);
      
      // Retry once after a short delay with withRetry mechanism
      await withRetry(async () => {
        const retryCommissionRate = await getCommissionRateForUser(referrerId);
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
          console.error("Échec de la seconde tentative de parrainage:", retryError);
          throw retryError;
        } else {
          console.log(`Parrainage enregistré (2e tentative) avec un taux de commission de ${retryCommissionRate * 100}%`);
        }
      }, 1, 2000);
    } else {
      console.log(`Parrainage enregistré avec succès avec un taux de commission de ${commissionRate * 100}%`);
    }
  } catch (error) {
    handleError(error, "Erreur lors de la création d'un nouveau parrainage");
  }
}

/**
 * Get referrals for a specific user
 * @param userId The user ID to get referrals for
 * @returns Array of referrals
 */
export async function getReferralsForUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erreur lors de la récupération des parrainages:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    handleError(error, "Erreur dans getReferralsForUser");
    return [];
  }
}
