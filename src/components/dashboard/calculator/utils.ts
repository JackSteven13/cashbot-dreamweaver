
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';

/**
 * Calculate revenue for all subscription plans based on user inputs
 */
export const calculateRevenueForAllPlans = (
  sessionsPerDay: number,
  daysPerMonth: number
): Record<string, { revenue: number, profit: number }> => {
  const results: Record<string, { revenue: number, profit: number }> = {};
  
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    // Pour le mode freemium, on ne peut faire qu'une session par jour
    const effectiveSessions = plan === 'freemium' ? 1 : sessionsPerDay;
    
    // On suppose qu'une session génère environ 40% de la limite quotidienne
    const sessionYield = dailyLimit * 0.4;
    const dailyRevenue = Math.min(sessionYield * effectiveSessions, dailyLimit);
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
