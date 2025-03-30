
import { PLAN_PRICES, COMMISSION_RATES, STRIPE_PERCENTAGE_FEE, STRIPE_FIXED_FEE } from "../utils/constants.ts";
import { createDetailedError } from "../utils/errorHandler.ts";

/**
 * Calcule la commission pour un parrainage basé sur le plan du parrainé et le plan du parrain
 * @param referredPlanType Le plan de l'utilisateur parrainé
 * @param referrerPlanType Le plan du parrain
 * @returns Le montant de la commission calculée
 */
export function calculateCommission(referredPlanType: string, referrerPlanType: string): number {
  try {
    // Obtenir le prix du plan de l'utilisateur parrainé
    const planPrice = PLAN_PRICES[referredPlanType] || PLAN_PRICES['default'];
    
    // Si le plan est gratuit, pas de commission
    if (planPrice === 0) return 0;
    
    // Obtenir le taux de commission basé sur le plan du parrain
    const commissionRate = COMMISSION_RATES[referrerPlanType] || COMMISSION_RATES['default'];
    
    // Calculer la commission (prix du plan * taux de commission)
    const commission = planPrice * commissionRate;
    
    // Arrondir le résultat à 2 décimales
    return Math.round(commission * 100) / 100;
  } catch (error) {
    throw createDetailedError(
      `Erreur lors du calcul de la commission pour le plan ${referredPlanType}`, 
      { referredPlanType, referrerPlanType, error }
    );
  }
}

/**
 * Calcule le prix net après frais Stripe
 * @param amount Le montant brut
 * @returns Le montant net après déduction des frais Stripe
 */
export function calculateNetAfterStripeFees(amount: number): number {
  try {
    // Calculer le montant net après frais Stripe (frais en pourcentage + frais fixe)
    const netAmount = amount - (amount * STRIPE_PERCENTAGE_FEE) - STRIPE_FIXED_FEE;
    
    // Ne pas permettre des montants négatifs
    if (netAmount < 0) return 0;
    
    // Arrondir le résultat à 2 décimales
    return Math.round(netAmount * 100) / 100;
  } catch (error) {
    throw createDetailedError(
      `Erreur lors du calcul du montant net après frais Stripe`, 
      { amount, error }
    );
  }
}
