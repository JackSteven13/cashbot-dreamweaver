
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { SUBSCRIPTION_PRICES } from './constants';

/**
 * Calcule les revenus pour tous les plans d'abonnement en fonction des entrées utilisateur
 * Utilise un calcul simple et cohérent pour une meilleure prédictibilité
 */
export const calculateRevenueForAllPlans = (
  sessionsPerDay: number,
  daysPerMonth: number
): Record<string, { revenue: number, profit: number }> => {
  const results: Record<string, { revenue: number, profit: number }> = {};
  
  // Multiplicateurs de base par plan
  const planMultipliers = {
    'freemium': 0.35,  // 35% de la limite quotidienne
    'starter': 0.50,   // 50% de la limite quotidienne
    'gold': 0.60,      // 60% de la limite quotidienne
    'elite': 0.70      // 70% de la limite quotidienne
  };
  
  // Pour chaque plan, calculer les revenus et profits mensuels
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    try {
      // Obtenir le multiplicateur pour ce plan
      const planMultiplier = planMultipliers[plan as keyof typeof planMultipliers] || 0.3;
      
      // Calcul du revenu quotidien basé sur un pourcentage de la limite quotidienne
      // Plus de sessions = plus de revenus, mais avec un plafond
      const baseSessionValue = sessionsPerDay > 0 ? Math.min(sessionsPerDay, 5) / 5 : 0.2;
      const effectiveMultiplier = planMultiplier * (0.7 + (baseSessionValue * 0.6));
      
      // Calculer le revenu quotidien (en pourcentage de la limite)
      const dailyRevenue = dailyLimit * effectiveMultiplier;
      
      // Calculer le revenu mensuel (cohérent avec le nombre de jours)
      const monthlyRevenue = dailyRevenue * daysPerMonth;
      
      // Obtenir le prix de l'abonnement
      const subscriptionPrice = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0;
      
      // Calculer le profit (revenu - coût)
      const profit = monthlyRevenue - subscriptionPrice;
      
      // Résultats avec 2 décimales
      results[plan] = {
        revenue: parseFloat(monthlyRevenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2))
      };
      
    } catch (error) {
      console.error(`Erreur lors du calcul pour le plan ${plan}:`, error);
      results[plan] = {
        revenue: 0,
        profit: -SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0
      };
    }
  });
  
  return results;
};
