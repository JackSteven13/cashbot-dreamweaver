
import { supabase } from "../utils/supabaseClient.ts";
import { calculateCommission } from "./calculationService.ts";
import { addCommissionTransaction } from "./transactionService.ts";
import { updateUserBalance } from "./balanceService.ts";

// Fonction principale pour traiter toutes les commissions
export async function processAllCommissions() {
  try {
    console.log("Début du traitement des commissions mensuelles...");
    
    // Récupérer tous les parrainages actifs
    const { data: activeReferrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*, user_balances!referrer_id(subscription)')
      .eq('status', 'active');
      
    if (referralsError) {
      console.error("Erreur lors de la récupération des parrainages actifs:", referralsError);
      return { success: false, message: "Erreur lors de la récupération des parrainages" };
    }
    
    if (!activeReferrals || activeReferrals.length === 0) {
      console.log("Aucun parrainage actif trouvé");
      return { success: true, message: "Aucun parrainage à traiter", processed: 0 };
    }
    
    console.log(`${activeReferrals.length} parrainages actifs trouvés, traitement en cours...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const referral of activeReferrals) {
      try {
        // Récupérer le plan du parrain pour calculer la commission
        const referrerPlan = referral.user_balances?.subscription || 'freemium';
        
        // Calculer la commission en tenant compte des frais Stripe et du plan du parrain
        const commissionAmount = calculateCommission(
          referral.plan_type, 
          referrerPlan
        );
        
        console.log(`Commission calculée pour le parrain ${referral.referrer_id}: ${commissionAmount}€ (plan: ${referrerPlan})`);
        
        // Ajouter la transaction
        const transactionAdded = await addCommissionTransaction(
          referral.referrer_id,
          commissionAmount,
          referral.referred_user_id,
          referral.plan_type
        );
        
        if (!transactionAdded) {
          console.error(`Échec de l'ajout de transaction pour le parrain ${referral.referrer_id}`);
          errorCount++;
          continue;
        }
        
        // Mettre à jour le solde
        const balanceUpdated = await updateUserBalance(
          referral.referrer_id,
          commissionAmount
        );
        
        if (!balanceUpdated) {
          console.error(`Échec de la mise à jour du solde pour le parrain ${referral.referrer_id}`);
          errorCount++;
          continue;
        }
        
        successCount++;
      } catch (error) {
        console.error(`Erreur lors du traitement de la commission pour le parrainage ${referral.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Traitement terminé. Réussis: ${successCount}, Échecs: ${errorCount}`);
    return { 
      success: true, 
      message: `Traitement terminé avec ${successCount} commissions traitées et ${errorCount} échecs`, 
      processed: successCount,
      errors: errorCount
    };
  } catch (error) {
    console.error("Erreur générale lors du traitement des commissions:", error);
    return { success: false, message: "Erreur générale lors du traitement" };
  }
}
