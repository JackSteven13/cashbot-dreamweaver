
import { supabase } from '../helpers/supabaseClient.ts';

// Find referrer from referral code - improved and more reliable
export async function findReferrer(referralCode: string | null) {
  if (!referralCode) return null;
  
  try {
    console.log("Recherche du parrain pour le code:", referralCode);
    
    // Multiple strategies to find the referrer
    
    // Strategy 1: Direct UUID match if referral code is a UUID
    if (referralCode.length >= 32 && referralCode.includes('-')) {
      const { data: directMatch, error: directError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', referralCode)
        .single();
        
      if (!directError && directMatch) {
        console.log("Parrain trouvé par correspondance UUID directe:", directMatch.id);
        return directMatch.id;
      }
    }
    
    // Strategy 2: Try format userId_code where the first part is the userId 
    const uuidPart = referralCode.split('_')[0];
    if (uuidPart && uuidPart.length >= 8) {
      const { data: matchWithPrefix, error: prefixError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', uuidPart)
        .maybeSingle();
        
      if (!prefixError && matchWithPrefix) {
        console.log("Parrain trouvé par partie UUID:", matchWithPrefix.id);
        return matchWithPrefix.id;
      }
      
      // Try with partial uuid match
      const { data: matchWithPartial, error: partialError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `${uuidPart}%`)
        .limit(1);
        
      if (!partialError && matchWithPartial && matchWithPartial.length > 0) {
        console.log("Parrain trouvé par UUID partiel:", matchWithPartial[0].id);
        return matchWithPartial[0].id;
      }
    }
    
    // Strategy 3: Direct check in referrals table for any codes/identifiers
    const { data: referralMatch, error: referralError } = await supabase
      .rpc('find_referrer_by_code', { code: referralCode });
      
    if (!referralError && referralMatch) {
      console.log("Parrain trouvé via RPC spécialisée:", referralMatch);
      return referralMatch;
    }
    
    console.log("Aucun parrain trouvé pour le code:", referralCode);
    return null;
  } catch (error) {
    console.error("Erreur lors du traitement du code de parrainage:", error);
    return null;
  }
}

// Get commission rate based on subscription - updated for new structure
async function getCommissionRateForUser(referrerId: string): Promise<number> {
  try {
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
    switch (userData.subscription) {
      case 'starter':
        return 0.6; // 60%
      case 'gold':
        return 0.8; // 80%
      case 'elite':
        return 1.0; // 100%
      default:
        return 0.4; // 40% for freemium
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du taux de commission:", error);
    return 0.4; // Default to freemium rate (40%)
  }
}

// Function to track a referral - enhanced with error retries and validation
export async function trackReferral(referrerId: string | null, newUserId: string, planType: string) {
  if (!referrerId || !newUserId) {
    console.log("Impossible de suivre le parrainage : informations manquantes");
    return;
  }
  
  if (referrerId === newUserId) {
    console.log("Auto-parrainage détecté, ignoré");
    return;
  }
  
  try {
    // Check if the referral already exists
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('referred_user_id', newUserId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Erreur lors de la vérification du parrainage existant:", checkError);
    }
    
    // Get standard commission rate (35%)
    const commissionRate = await getCommissionRateForUser(referrerId);
    console.log(`Taux de commission pour ${referrerId}: ${commissionRate * 100}%`);
    
    if (existingReferral) {
      console.log("Ce parrainage existe déjà, mise à jour du statut si nécessaire");
      
      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          status: 'active',
          plan_type: planType,
          commission_rate: commissionRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReferral.id);
        
      if (updateError) {
        console.error("Erreur lors de la mise à jour du parrainage:", updateError);
      } else {
        console.log(`Parrainage mis à jour: ${referrerId} a parrainé ${newUserId} avec un taux de commission de ${commissionRate * 100}%`);
      }
      
      return;
    }
    
    // Create a new referral with appropriate commission rate
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
      
      // Retry once after a short delay
      setTimeout(async () => {
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
        } else {
          console.log(`Parrainage enregistré (2e tentative): ${referrerId} a parrainé ${newUserId} avec un taux de commission de ${retryCommissionRate * 100}%`);
        }
      }, 1000);
    } else {
      console.log(`Parrainage enregistré avec succès: ${referrerId} a parrainé ${newUserId} avec un taux de commission de ${commissionRate * 100}%`);
    }
  } catch (error) {
    console.error("Erreur dans trackReferral:", error);
  }
}

// Function to get referrals for a user
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
    console.error("Erreur dans getReferralsForUser:", error);
    return [];
  }
}
