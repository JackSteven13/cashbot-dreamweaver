
import { supabase } from "@/integrations/supabase/client";
import { COMMISSION_RATES } from "@/components/dashboard/summary/constants";

/**
 * Génère un lien d'affiliation pour un utilisateur
 */
export const generateReferralLink = (userId: string): string => {
  // Format du lien : URL de base + userId codé
  const baseUrl = window.location.origin;
  return `${baseUrl}/register?ref=${userId}`;
};

/**
 * Récupère les affiliations d'un utilisateur
 */
export const fetchUserReferrals = async (userId: string): Promise<any[]> => {
  try {
    // Récupérer les affiliations où l'utilisateur est le parrain
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);
      
    if (error) {
      console.error("Error fetching referrals:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchUserReferrals:", error);
    return [];
  }
};

/**
 * Calcule le bonus d'affiliation pour un utilisateur
 */
export const calculateReferralBonus = (referrals: Array<any>): number => {
  if (!referrals || referrals.length === 0) return 0;
  
  // Filtrer les affiliations actives et calculer la somme des commissions
  return referrals
    .filter(ref => ref.status === 'active')
    .reduce((total, ref) => total + (Number(ref.commission_rate) || 0), 0);
};

/**
 * Applique un bonus d'affiliation au solde d'un utilisateur
 */
export const applyReferralBonus = async (
  referrerId: string,
  newUserId: string,
  planType: string = 'freemium'
): Promise<boolean> => {
  try {
    if (!referrerId || !newUserId) return false;
    
    // Récupérer le forfait du parrain pour déterminer son taux de commission
    const { data: referrerData, error: referrerError } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', referrerId)
      .single();
      
    if (referrerError || !referrerData) {
      console.error("Error fetching referrer subscription:", referrerError);
      return false;
    }
    
    const referrerSubscription = referrerData.subscription || 'freemium';
    const commissionRate = COMMISSION_RATES[referrerSubscription as keyof typeof COMMISSION_RATES] || 0.2;
    
    // Montant de base dépendant du forfait souscrit (valeurs fictives pour l'exemple)
    const basePlanValue = getPlanBaseValue(planType);
    const commissionAmount = basePlanValue * commissionRate;
    
    // Créer l'enregistrement d'affiliation
    const { error: referralError } = await supabase
      .from('referrals')
      .insert([
        {
          referrer_id: referrerId,
          referred_user_id: newUserId,
          plan_type: planType,
          commission_rate: commissionAmount,
          status: 'active'
        }
      ]);
      
    if (referralError) {
      console.error("Error creating referral record:", referralError);
      return false;
    }
    
    // Ajouter une transaction pour le parrain
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: referrerId,
          gain: commissionAmount,
          report: `Commission d'affiliation pour un abonnement ${planType}`
        }
      ]);
      
    if (transactionError) {
      console.error("Error adding transaction:", transactionError);
      return false;
    }
    
    // Mettre à jour le solde du parrain
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('id', referrerId)
      .single();
      
    if (balanceError) {
      console.error("Error fetching balance:", balanceError);
      return false;
    }
    
    const currentBalance = Number(balanceData?.balance || 0);
    const newBalance = currentBalance + commissionAmount;
    
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', referrerId);
      
    if (updateError) {
      console.error("Error updating balance:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in applyReferralBonus:", error);
    return false;
  }
};

/**
 * Fonction utilitaire pour obtenir la valeur de base d'un forfait
 */
const getPlanBaseValue = (planType: string): number => {
  // Montants fictifs pour l'exemple
  const planValues = {
    'freemium': 0,
    'starter': 10,
    'gold': 25,
    'elite': 50
  };
  
  return planValues[planType as keyof typeof planValues] || 0;
};
