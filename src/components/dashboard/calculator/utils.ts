
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';

/**
 * Calculate revenue for all subscription plans based on user inputs
 * Revised to create more realistic and differentiated results between plans
 */
export const calculateRevenueForAllPlans = (
  sessionsPerDay: number,
  daysPerMonth: number
): Record<string, { revenue: number, profit: number }> => {
  const results: Record<string, { revenue: number, profit: number }> = {};
  
  // Facteurs d'efficacité pour chaque plan (plus performant pour les plans supérieurs)
  const efficiencyFactors = {
    'freemium': 0.35,
    'pro': 0.68,
    'visionnaire': 0.85,
    'alpha': 0.94
  };
  
  // Variabilité pour rendre les chiffres moins ronds (±5%)
  const getRandomVariation = () => 1 + ((Math.random() * 10) - 5) / 100;
  
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    // Pour le mode freemium, on ne peut faire qu'une session par jour
    const effectiveSessions = plan === 'freemium' ? Math.min(1, sessionsPerDay) : sessionsPerDay;
    
    // Calcul avec facteur d'efficacité spécifique au plan
    const efficiency = efficiencyFactors[plan as keyof typeof efficiencyFactors];
    
    // Calcul du rendement par session (plus élevé pour les plans supérieurs)
    const sessionYield = dailyLimit * efficiency * getRandomVariation();
    
    // Les plans supérieurs ont une meilleure optimisation lors de sessions multiples
    const sessionMultiplier = plan === 'freemium' ? 1 : 
                             plan === 'pro' ? 1.05 : 
                             plan === 'visionnaire' ? 1.12 : 1.18;
    
    // Application du multiplicateur pour sessions multiples (pour les plans non-freemium)
    const dailyRevenue = Math.min(
      sessionYield * effectiveSessions * (effectiveSessions > 1 ? sessionMultiplier : 1),
      dailyLimit // Toujours limité par le plafond quotidien
    );
    
    // Ajout d'une légère variabilité par jour pour éviter les chiffres trop ronds
    const monthlyRevenue = dailyRevenue * daysPerMonth * getRandomVariation();
    
    const subscriptionPrice = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0;
    
    results[plan] = {
      revenue: parseFloat(monthlyRevenue.toFixed(2)),
      profit: parseFloat((monthlyRevenue - subscriptionPrice).toFixed(2))
    };
  });
  
  return results;
};

// Import subscription prices from constants
import { SUBSCRIPTION_PRICES } from './constants';
