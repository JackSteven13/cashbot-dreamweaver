
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { SUBSCRIPTION_PRICES } from './constants';

/**
 * Calcule les revenus pour tous les plans d'abonnement de manière cohérente
 * avec un ROI fixe de 67% pour tous les plans
 */
export const calculateRevenueForAllPlans = (
  sessionsPerDay: number,
  daysPerMonth: number
): Record<string, { revenue: number, profit: number }> => {
  const results: Record<string, { revenue: number, profit: number }> = {};
  
  // ROI cible cohérent pour tous les plans
  const targetROI = 0.67; // 67%
  
  // Pour chaque plan, calculer les revenus et profits mensuels
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    try {
      // Obtenir le prix de l'abonnement
      const subscriptionPrice = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0;
      
      // Calculer l'utilisation moyenne (entre 70% et 90% de la limite quotidienne)
      // Plus de sessions = meilleure utilisation de la limite
      const baseUtilization = 0.7 + (Math.min(sessionsPerDay, 5) / 5) * 0.2;
      
      // Calculer le revenu mensuel basé sur la limite quotidienne et le nombre de jours
      const monthlyRevenue = dailyLimit * baseUtilization * daysPerMonth;
      
      // Calculer le profit en utilisant le ROI cible
      // Profit = Revenue - Subscription Cost
      // Si Revenue = Subscription Cost / (1 - ROI), alors Profit/Subscription Cost = ROI
      const expectedProfit = monthlyRevenue - subscriptionPrice;
      
      // Assurer que le rapport profit/revenu est cohérent (ajuster si nécessaire)
      let finalRevenue = monthlyRevenue;
      let finalProfit = expectedProfit;
      
      // Si le profit est inférieur à ce qui est attendu avec notre ROI cible, ajuster le revenu
      if (expectedProfit < subscriptionPrice * targetROI) {
        finalProfit = subscriptionPrice * targetROI;
        finalRevenue = finalProfit + subscriptionPrice;
      }
      
      // Résultats avec 2 décimales
      results[plan] = {
        revenue: parseFloat(finalRevenue.toFixed(2)),
        profit: parseFloat(finalProfit.toFixed(2))
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
