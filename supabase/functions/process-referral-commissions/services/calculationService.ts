
import { PLAN_PRICES, COMMISSION_RATES, STRIPE_PERCENTAGE_FEE, STRIPE_FIXED_FEE } from "../utils/constants.ts";

// Calculer le montant de commission après frais Stripe
export function calculateCommission(planType: string, referrerPlan: string): number {
  // Récupérer le prix du plan
  const planPrice = PLAN_PRICES[planType as keyof typeof PLAN_PRICES] || PLAN_PRICES.default;
  
  // Si c'est un plan gratuit, pas de commission
  if (planPrice === 0) return 0;
  
  // Calculer le montant net après frais Stripe
  const stripeFees = planPrice * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE;
  const netAmount = planPrice - stripeFees;
  
  // Récupérer le taux de commission basé sur le plan du parrain
  const commissionRate = COMMISSION_RATES[referrerPlan as keyof typeof COMMISSION_RATES] || COMMISSION_RATES.default;
  
  // Calculer la commission
  const commission = netAmount * commissionRate;
  
  // Arrondir à 2 décimales
  return parseFloat(commission.toFixed(2));
}
