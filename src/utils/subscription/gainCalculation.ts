
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
      
      // Facteur d'efficacité réduit significativement - BEAUCOUP PLUS LENT
      // Entre 35% et 55% seulement de la limite quotidienne selon le nombre de sessions
      const baseUtilization = 0.35 + (Math.min(sessionsPerDay, 10) / 10) * 0.20;
      
      // Multiplicateur de performance par plan - RÉDUIT SIGNIFICATIVEMENT
      let performanceMultiplier = 0.85; // Valeur de base réduite
      if (plan === 'starter') performanceMultiplier = 0.90;
      if (plan === 'gold') performanceMultiplier = 0.95;
      if (plan === 'elite') performanceMultiplier = 1.00;
      
      // Calcul du revenu mensuel
      const monthlyRevenue = Number(dailyLimit) * baseUtilization * daysPerMonth * performanceMultiplier;
      
      // Calcul du profit mensuel (revenu - coût de l'abonnement)
      const monthlyProfit = monthlyRevenue - monthlySubscriptionCost;
      
      // Limiter les gains par mois selon le plan pour garantir une progression lente
      const maxMonthlyRevenue = {
        'freemium': 8, // ~38 mois pour atteindre 300€
        'starter': 20, // ~30 mois pour atteindre 600€ 
        'gold': 45,   // ~27 mois pour atteindre 1200€
        'elite': 100  // ~25 mois pour atteindre 2500€
      };
      
      // Appliquer la limite maximum par mois
      const cappedRevenue = Math.min(
        monthlyRevenue, 
        maxMonthlyRevenue[plan as keyof typeof maxMonthlyRevenue] || 8
      );
      
      // Recalcul du profit avec le revenu plafonné
      const cappedProfit = cappedRevenue - monthlySubscriptionCost;
      
      results[plan] = {
        revenue: parseFloat(cappedRevenue.toFixed(2)),
        profit: parseFloat(cappedProfit.toFixed(2))
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
  
  // Facteur d'efficacité RÉDUIT SIGNIFICATIVEMENT pour une progression beaucoup plus lente
  // Maximum de 45% de la limite quotidienne même avec beaucoup de sessions
  const efficiencyFactor = Math.min(0.25 + (sessionsPerDay * 0.02), 0.45);
  
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
