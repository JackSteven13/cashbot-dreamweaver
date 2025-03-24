
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';

/**
 * Calculate revenue for all subscription plans based on user inputs
 * Added differentiation between plans to show significant revenue increases
 */
export const calculateRevenueForAllPlans = (
  sessionsPerDay: number,
  daysPerMonth: number
): Record<string, { revenue: number, profit: number }> => {
  const results: Record<string, { revenue: number, profit: number }> = {};
  
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    // Pour le mode freemium, on ne peut faire qu'une session par jour
    const effectiveSessions = plan === 'freemium' ? 1 : sessionsPerDay;
    
    // Facteurs d'efficacité selon le plan
    let efficiencyFactor = 0.4; // Base factor
    
    // Augmenter le facteur d'efficacité en fonction du plan
    switch(plan) {
      case 'freemium':
        efficiencyFactor = 0.25; // 25% efficiency
        break;
      case 'pro':
        efficiencyFactor = 0.6; // 60% efficiency
        break;
      case 'visionnaire':
        efficiencyFactor = 0.8; // 80% efficiency
        break;
      case 'alpha':
        efficiencyFactor = 0.95; // 95% efficiency
        break;
    }
    
    // Bonus multiplicateurs pour créer des écarts substantiels entre les plans
    let planMultiplier = 1;
    switch(plan) {
      case 'pro':
        planMultiplier = 1.25; // 25% bonus
        break;
      case 'visionnaire':
        planMultiplier = 1.6; // 60% bonus
        break;
      case 'alpha':
        planMultiplier = 2.1; // 110% bonus
        break;
    }
    
    // Le yield par session est maintenant influencé par le plan et les facteurs d'efficacité
    const sessionYield = dailyLimit * efficiencyFactor * planMultiplier;
    const dailyRevenue = Math.min(sessionYield * effectiveSessions, dailyLimit * planMultiplier);
    const monthlyRevenue = dailyRevenue * daysPerMonth;
    
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
