
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

/**
 * Structure des informations de commission pour un utilisateur
 */
export interface CommissionInfo {
  baseRate: number;
  effectiveRate: number;
  tier2Rate: number;
  referralCount: number;
  totalEarned: number;
  isTopReferrer: boolean;
}

/**
 * Obtient le taux de commission de base en fonction du type d'abonnement
 * @param subscription Type d'abonnement
 * @returns Taux de commission (en décimal)
 */
export function getCommissionRate(subscription: string): number {
  const rates: Record<string, number> = {
    'starter': 0.3,  // 30%
    'gold': 0.4,     // 40%
    'elite': 0.5,    // 50%
    'freemium': 0.2  // 20%
  };
  
  return rates[subscription] || 0.2;
}

/**
 * Calcul le bonus de parrainage en fonction des filleuls actifs
 * @param referrals Liste des parrainages
 * @param subscription Type d'abonnement
 * @returns Montant du bonus de parrainage
 */
export function calculateReferralBonus(
  referrals: Array<any> = [],
  subscription: string = 'freemium'
): number {
  if (!referrals || referrals.length === 0) return 0;
  
  const baseCommissionRate = getCommissionRate(subscription);
  
  // Calculer le bonus pour chaque filleul actif
  return referrals.reduce((total, referral) => {
    // Si le parrainage est actif et a un taux de commission valide
    if (referral.status === 'active' && typeof referral.commission_rate === 'number') {
      const referralBonus = referral.balance * referral.commission_rate * baseCommissionRate;
      return total + (isNaN(referralBonus) ? 0 : referralBonus);
    }
    return total;
  }, 0);
}

/**
 * Applique le bonus de parrainage au solde de l'utilisateur
 */
export async function applyReferralBonus(
  userId: string,
  amount: number,
  description: string = "Bonus de parrainage"
): Promise<boolean> {
  try {
    if (!amount || amount <= 0) return false;
    
    // Récupérer le solde actuel
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('id', userId)
      .single();
      
    if (balanceError) {
      console.error('Erreur lors de la récupération du solde:', balanceError);
      return false;
    }
    
    // Ensure we're working with a number for calculations
    const currentBalance = typeof balanceData.balance === 'string' 
      ? parseFloat(balanceData.balance) 
      : balanceData.balance;
    
    const newBalance = currentBalance + amount;
    
    // Mettre à jour le solde - convert to string as the database expects a string
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({ balance: newBalance.toString() })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Erreur lors de la mise à jour du solde:', updateError);
      return false;
    }
    
    // Ajouter une transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: amount,
        report: `${description}: +${amount.toFixed(2)}€`
      });
      
    if (transactionError) {
      console.error('Erreur lors de l\'ajout de la transaction:', transactionError);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'application du bonus de parrainage:', error);
    return false;
  }
}

/**
 * Obtient les informations complètes de commission pour un utilisateur
 */
export async function getUserCommissionInfo(userId: string, subscription: string): Promise<CommissionInfo> {
  try {
    // Récupérer les filleuls actifs
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('referred_user_id, commission_rate, status')
      .eq('referrer_id', userId)
      .eq('status', 'active');
      
    if (referralsError) {
      console.error('Erreur lors de la récupération des parrainages:', referralsError);
      return {
        baseRate: getCommissionRate(subscription),
        effectiveRate: getCommissionRate(subscription),
        tier2Rate: 0.05, // 5% pour les filleuls de niveau 2
        referralCount: 0,
        totalEarned: 0,
        isTopReferrer: false
      };
    }
    
    // Calcul du taux effectif avec bonus pour les parrains performants
    const referralCount = referrals?.length || 0;
    const baseRate = getCommissionRate(subscription);
    let effectiveRate = baseRate;
    
    // Bonus pour les parrains ayant beaucoup de filleuls
    if (referralCount >= 10) {
      effectiveRate = baseRate * 1.2; // +20% de bonus
    } else if (referralCount >= 5) {
      effectiveRate = baseRate * 1.1; // +10% de bonus
    }
    
    // Vérifier si l'utilisateur est un parrain performant (top 10%)
    const isTopReferrer = referralCount >= 5;
    
    // Récupérer le total gagné via le parrainage (somme des transactions avec "Bonus de parrainage")
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('gain')
      .eq('user_id', userId)
      .ilike('report', '%Bonus de parrainage%');
      
    let totalEarned = 0;
    
    if (!transactionsError && transactions) {
      totalEarned = transactions.reduce((sum, tx) => {
        // Handle both string and number types for gain
        const txGain = typeof tx.gain === 'string' ? parseFloat(tx.gain) : tx.gain;
        return sum + (isNaN(txGain) ? 0 : txGain);
      }, 0);
    }
    
    return {
      baseRate,
      effectiveRate,
      tier2Rate: 0.05,
      referralCount,
      totalEarned,
      isTopReferrer
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de commission:', error);
    return {
      baseRate: getCommissionRate(subscription),
      effectiveRate: getCommissionRate(subscription),
      tier2Rate: 0.05,
      referralCount: 0,
      totalEarned: 0,
      isTopReferrer: false
    };
  }
}
