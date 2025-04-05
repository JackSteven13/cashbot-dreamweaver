
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { SUBSCRIPTION_PRICES } from './constants';

/**
 * Calcule les revenus pour tous les plans d'abonnement de manière cohérente
 * et impressionnante pour mettre en valeur notre technologie
 */
export const calculateRevenueForAllPlans = (
  sessionsPerDay: number,
  daysPerMonth: number
): Record<string, { revenue: number, profit: number }> => {
  const results: Record<string, { revenue: number, profit: number }> = {};
  
  // Pour chaque plan, calculer les revenus et profits mensuels
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    try {
      // Obtenir le prix de l'abonnement
      const subscriptionPrice = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0;
      
      // Calculer l'utilisation moyenne (entre 75% et 95% de la limite quotidienne)
      // Plus de sessions = meilleure utilisation de la limite
      const baseUtilization = 0.75 + (Math.min(sessionsPerDay, 5) / 5) * 0.20;
      
      // Calculer le revenu mensuel basé sur la limite quotidienne et le nombre de jours
      // Les plans payants ont un multiplicateur de performance supplémentaire
      let performanceMultiplier = 1.0;
      if (plan === 'starter') performanceMultiplier = 1.15;
      if (plan === 'gold') performanceMultiplier = 1.3;
      if (plan === 'elite') performanceMultiplier = 1.45;
      
      // Revenu basé sur la limite journalière, l'utilisation, les jours et le multiplicateur
      const monthlyRevenue = Number(dailyLimit) * baseUtilization * daysPerMonth * performanceMultiplier;
      
      // Le profit est le revenu moins le coût de l'abonnement
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
