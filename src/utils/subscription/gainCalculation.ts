import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { SUBSCRIPTION_PRICES } from '@/components/dashboard/calculator/constants';

export const calculateAllPlansRevenue = (
  sessionsPerDay: number,
  daysPerMonth: number
): Record<string, { revenue: number, profit: number }> => {
  const results: Record<string, { revenue: number, profit: number }> = {};
  
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    try {
      // Prix mensuel de l'abonnement (divisé par 12 pour obtenir le coût mensuel)
      const monthlySubscriptionCost = SUBSCRIPTION_PRICES[plan] / 12;
      
      // Calculer l'utilisation moyenne (entre 80% et 95% de la limite quotidienne)
      const baseUtilization = 0.80 + (Math.min(sessionsPerDay, 5) / 5) * 0.15;
      
      // Multiplicateur de performance par plan
      let performanceMultiplier = 1.0;
      if (plan === 'starter') performanceMultiplier = 1.30;
      if (plan === 'gold') performanceMultiplier = 1.45;
      if (plan === 'elite') performanceMultiplier = 1.60;
      
      // Calcul du revenu mensuel
      const monthlyRevenue = Number(dailyLimit) * baseUtilization * daysPerMonth * performanceMultiplier;
      
      // Calcul du profit mensuel (revenu - coût de l'abonnement)
      const monthlyProfit = monthlyRevenue - monthlySubscriptionCost;
      
      results[plan] = {
        revenue: parseFloat(monthlyRevenue.toFixed(2)),
        profit: parseFloat(monthlyProfit.toFixed(2))
      };
      
    } catch (error) {
      console.error(`Erreur lors du calcul pour le plan ${plan}:`, error);
      results[plan] = {
        revenue: 0,
        profit: -SUBSCRIPTION_PRICES[plan] / 12 || 0
      };
    }
  });
  
  return results;
};

// Conserver la fonction existante pour compatibilité
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
