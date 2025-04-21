
import { SUBSCRIPTION_LIMITS } from './constants';
import { SUBSCRIPTION_PRICES } from '@/components/dashboard/calculator/constants';

/**
 * Calcule les gains potentiels en fonction du type d'abonnement et des sessions
 * avec des valeurs très réalistes
 */
export const calculatePotentialGains = (
  subscriptionType: string,
  sessionsPerDay: number = 1,
  daysPerMonth: number = 20
): { dailyGain: number; monthlyGain: number; } => {
  // Obtenir la limite quotidienne selon l'abonnement
  const dailyLimit = SUBSCRIPTION_LIMITS[subscriptionType as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Facteur d'efficacité basé sur le nombre de sessions (plus réaliste)
  // L'efficacité plafonne rapidement
  const efficiencyFactor = Math.min(0.55 + (sessionsPerDay * 0.03), 0.75);
  
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
 * Calcule les revenus pour tous les plans d'abonnement avec des valeurs réalistes
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
      
      // Calculer l'utilisation moyenne (entre 55% et 70% de la limite quotidienne - plus réaliste)
      // Plus de sessions = meilleure utilisation de la limite, mais avec plafond bas
      const baseUtilization = 0.55 + (Math.min(sessionsPerDay, 5) / 5) * 0.15;
      
      // Multiplicateur de performance selon le plan (valeurs crédibles)
      let performanceMultiplier = 1.0;
      if (plan === 'starter') performanceMultiplier = 1.03; // 3% de bonus
      if (plan === 'gold') performanceMultiplier = 1.07;    // 7% de bonus
      if (plan === 'elite') performanceMultiplier = 1.12;   // 12% de bonus
      
      // Calcul du revenu mensuel avec le multiplicateur
      const monthlyRevenue = dailyLimit * baseUtilization * daysPerMonth * performanceMultiplier;
      
      // Ajustement du prix mensuel de l'abonnement (annuellement divisé par 12)
      const monthlySubscriptionPrice = subscriptionPrice / 12;
      
      // Le profit est le revenu moins le coût mensuel de l'abonnement
      const profit = monthlyRevenue - monthlySubscriptionPrice;
      
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
