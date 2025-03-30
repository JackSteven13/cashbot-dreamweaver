
import { calculateCommission } from "./calculationService.ts";
import { addCommissionTransaction } from "./transactionService.ts";
import { updateUserBalance } from "./balanceService.ts";
import { createDetailedError } from "../utils/errorHandler.ts";

/**
 * Traite la commission pour un parrainage spécifique
 * @param referral Les données du parrainage
 * @returns true si la commission a été traitée avec succès, sinon false
 */
export async function processReferralCommission(referral: any): Promise<boolean> {
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
