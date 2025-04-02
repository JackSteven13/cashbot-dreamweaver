
import { COMMISSION_RATES } from "@/components/dashboard/summary/constants";
import { supabase } from "@/integrations/supabase/client";

/**
 * Calculate referral bonus percentage based on number of active referrals
 * @param referralsCount Number of active referrals
 * @returns Bonus percentage as integer
 */
export const calculateReferralBonus = (referralsCount: number) => {
  if (referralsCount <= 0) return 0;
  
  // 5% bonus per referral, up to 25% maximum
  const bonus = Math.min(referralsCount * 5, 25);
  
  // Return as integer for cleaner UI display
  return Math.floor(bonus);
};

/**
 * Get commission rate based on subscription type
 * @param subscription User subscription level
 * @returns Commission rate as decimal
 */
export const getCommissionRate = (subscription: string) => {
  // Vérification stricte des valeurs possibles pour éviter les erreurs
  if (!subscription || typeof subscription !== 'string') {
    console.warn("Type d'abonnement invalide pour le calcul du taux de commission:", subscription);
    return 0.2; // Valeur par défaut sécurisée
  }
  
  // S'assurer que la clé existe dans notre objet de taux
  const validSubscription = COMMISSION_RATES.hasOwnProperty(subscription as keyof typeof COMMISSION_RATES) 
    ? subscription 
    : 'freemium';
    
  return COMMISSION_RATES[validSubscription as keyof typeof COMMISSION_RATES];
};

/**
 * Apply referral bonus to a value
 * @param value Base value to apply bonus to
 * @param referralsCount Number of referrals
 * @returns Value with bonus applied
 */
export const applyReferralBonus = (value: number, referralsCount: number) => {
  if (typeof value !== 'number' || isNaN(value)) {
    console.warn("Valeur invalide pour l'application du bonus de parrainage:", value);
    return 0;
  }
  
  if (typeof referralsCount !== 'number' || isNaN(referralsCount)) {
    console.warn("Nombre de parrainages invalide:", referralsCount);
    return value;
  }
  
  const bonusPercentage = calculateReferralBonus(referralsCount);
  const bonusMultiplier = 1 + (bonusPercentage / 100);
  return value * bonusMultiplier;
};

/**
 * Get the user's commission information for display purposes
 * @param userId User ID to check
 * @returns Object with rate and subscription information
 */
export const getUserCommissionInfo = async (userId: string) => {
  if (!userId) {
    console.warn("ID utilisateur manquant pour getUserCommissionInfo");
    return {
      rate: 0.2, // Valeur par défaut
      subscription: 'freemium'
    };
  }
  
  try {
    // Get the user's subscription first
    const { data: userData, error: userError } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', userId)
      .maybeSingle();
      
    if (userError || !userData) {
      console.error('Erreur lors de la récupération de l\'abonnement utilisateur:', userError);
      return {
        rate: 0.2, // Valeur par défaut
        subscription: 'freemium'
      };
    }
    
    // Vérification et normalisation de l'abonnement
    const subscription = userData.subscription || 'freemium';
    
    // Récupérer le taux de commission en utilisant la fonction centralisée
    const rate = getCommissionRate(subscription);
    
    return {
      rate,
      subscription
    };
  } catch (error) {
    console.error('Erreur dans getUserCommissionInfo:', error);
    return {
      rate: 0.2, // Valeur par défaut en cas d'erreur
      subscription: 'freemium'
    };
  }
};
