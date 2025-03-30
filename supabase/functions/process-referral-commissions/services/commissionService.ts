
import { supabase } from "../utils/supabaseClient.ts";
import { calculateCommission } from "./calculationService.ts";
import { addCommissionTransaction } from "./transactionService.ts";
import { updateUserBalance } from "./balanceService.ts";
import { withRetry } from "../utils/retryMechanism.ts";
import { createDetailedError, handleError } from "../utils/errorHandler.ts";

/**
 * Interface pour les résultats du traitement des commissions
 */
interface CommissionProcessingResult {
  success: boolean;
  message: string;
  processed?: number;
  errors?: number;
  failedIds?: string[];
}

/**
 * Traite la commission pour un parrainage spécifique
 * @param referral Les données du parrainage
 * @returns true si la commission a été traitée avec succès, sinon false
 */
async function processReferralCommission(referral: any): Promise<boolean> {
  try {
    // Récupérer le plan du parrain pour calculer la commission
    const referrerPlan = referral.user_balances?.subscription || 'freemium';
    
    // Calculer la commission en tenant compte du plan du parrain
    const commissionAmount = calculateCommission(
      referral.plan_type, 
      referrerPlan
    );
    
    console.log(`Commission calculée pour le parrain ${referral.referrer_id}: ${commissionAmount}€ (plan: ${referrerPlan})`);
    
    // Si la commission est nulle, ne pas poursuivre
    if (commissionAmount <= 0) {
      console.log(`Aucune commission à traiter pour le parrain ${referral.referrer_id} (montant: ${commissionAmount}€)`);
      return true;
    }
    
    // Ajouter la transaction
    const transactionAdded = await addCommissionTransaction(
      referral.referrer_id,
      commissionAmount,
      referral.referred_user_id,
      referral.plan_type
    );
    
    if (!transactionAdded) {
      throw createDetailedError(
        `Échec de l'ajout de transaction pour le parrain ${referral.referrer_id}`,
        { referrerId: referral.referrer_id, amount: commissionAmount }
      );
    }
    
    // Mettre à jour le solde
    const balanceUpdated = await updateUserBalance(
      referral.referrer_id,
      commissionAmount
    );
    
    if (!balanceUpdated) {
      throw createDetailedError(
        `Échec de la mise à jour du solde pour le parrain ${referral.referrer_id}`,
        { referrerId: referral.referrer_id, amount: commissionAmount }
      );
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors du traitement de la commission pour le parrainage ${referral.id}:`, error);
    return false;
  }
}

/**
 * Récupère tous les parrainages actifs
 * @returns Un tableau de parrainages actifs
 */
async function getActiveReferrals(): Promise<any[]> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*, user_balances!referrer_id(subscription)')
        .eq('status', 'active');
        
      if (error) {
        throw createDetailedError(
          "Erreur lors de la récupération des parrainages actifs",
          { supabaseError: error }
        );
      }
      
      return data || [];
    }, 3, 1000); // Retry up to 3 times with 1s initial delay
  } catch (error) {
    console.error("Erreur lors de la récupération des parrainages actifs:", error);
    throw error; // Propager l'erreur pour être gérée par la fonction appelante
  }
}

/**
 * Fonction principale pour traiter toutes les commissions
 */
export async function processAllCommissions(): Promise<CommissionProcessingResult> {
  try {
    console.log("Début du traitement des commissions mensuelles...");
    
    // Récupérer tous les parrainages actifs
    const activeReferrals = await getActiveReferrals();
    
    if (!activeReferrals || activeReferrals.length === 0) {
      console.log("Aucun parrainage actif trouvé");
      return { success: true, message: "Aucun parrainage à traiter", processed: 0 };
    }
    
    console.log(`${activeReferrals.length} parrainages actifs trouvés, traitement en cours...`);
    
    let successCount = 0;
    let errorCount = 0;
    const failedIds: string[] = [];
    
    // Traiter les parrainages par lots pour éviter les surcharges
    const batchSize = 10;
    for (let i = 0; i < activeReferrals.length; i += batchSize) {
      const batch = activeReferrals.slice(i, i + batchSize);
      
      // Traiter chaque parrainage du lot en parallèle
      const results = await Promise.all(
        batch.map(async (referral) => {
          try {
            const success = await processReferralCommission(referral);
            if (success) {
              return { success: true, id: referral.id };
            } else {
              return { success: false, id: referral.id };
            }
          } catch (error) {
            console.error(`Erreur dans le traitement du parrainage ${referral.id}:`, error);
            return { success: false, id: referral.id };
          }
        })
      );
      
      // Compter les succès et les échecs
      results.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          failedIds.push(result.id);
        }
      });
      
      // Petite pause entre les lots pour éviter de surcharger la base de données
      if (i + batchSize < activeReferrals.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Traitement terminé. Réussis: ${successCount}, Échecs: ${errorCount}`);
    
    return { 
      success: true, 
      message: `Traitement terminé avec ${successCount} commissions traitées et ${errorCount} échecs`, 
      processed: successCount,
      errors: errorCount,
      failedIds: failedIds.length > 0 ? failedIds : undefined
    };
  } catch (error) {
    const errorResponse = handleError(error, "Erreur générale lors du traitement des commissions");
    return { 
      success: false, 
      message: "Erreur générale lors du traitement des commissions",
      errors: 1
    };
  }
}
