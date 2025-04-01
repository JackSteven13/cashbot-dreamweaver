
import { SUBSCRIPTION_LIMITS } from './constants';
import { SUBSCRIPTION_PRICES } from '@/components/dashboard/calculator/constants';

/**
 * Calcule les gains potentiels en fonction du type d'abonnement et des sessions
 */
export const calculatePotentialGains = (
  subscriptionType: string,
  sessionsPerDay: number = 1,
  daysPerMonth: number = 20
): { dailyGain: number; monthlyGain: number; } => {
  // Obtenir la limite quotidienne selon l'abonnement
  const dailyLimit = SUBSCRIPTION_LIMITS[subscriptionType as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Facteur d'efficacité basé sur le nombre de sessions (plus de sessions = meilleure efficacité)
  const efficiencyFactor = Math.min(0.75 + (sessionsPerDay * 0.05), 0.95);
  
  // Calcul du gain journalier (limité au maximum quotidien)
  const rawDailyGain = dailyLimit * efficiencyFactor;
  const dailyGain = Math.min(rawDailyGain, dailyLimit);
  
  // Calcul du gain mensuel
  const monthlyGain = dailyGain * daysPerMonth;
  
  return {
    dailyGain: parseFloat(dailyGain.toFixed(2)),
    monthlyGain: parseFloat(monthlyGain.toFixed(2))
  };
};

/**
 * Calcule les revenus pour tous les plans d'abonnement sans référence au ROI
 */
export const calculateAllPlansRevenue = (
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
      const baseUtilization = 0.75 + (Math.min(sessionsPerDay, 5) / 5) * 0.20;
      
      // Multiplicateur de performance selon le plan
      let performanceMultiplier = 1.0;
      if (plan === 'pro') performanceMultiplier = 1.15;
      if (plan === 'visionnaire') performanceMultiplier = 1.3;
      if (plan === 'elite') performanceMultiplier = 1.45;
      
      // Calcul du revenu mensuel avec le multiplicateur
      const monthlyRevenue = dailyLimit * baseUtilization * daysPerMonth * performanceMultiplier;
      
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
