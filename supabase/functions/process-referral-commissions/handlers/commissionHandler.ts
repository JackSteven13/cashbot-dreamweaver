
import { CommissionProcessingResult } from "../types/commissionTypes.ts";
import { getActiveReferrals } from "../services/referralService.ts";
import { processReferralCommission } from "../services/commissionProcessor.ts";
import { handleError } from "../utils/errorHandler.ts";

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
