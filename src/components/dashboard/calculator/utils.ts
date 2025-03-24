
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
  
  // Efficiency factors for each plan (more efficient for higher plans)
  const efficiencyFactors = {
    'freemium': 0.35,
    'pro': 0.68,
    'visionnaire': 0.85,
    'alpha': 0.94
  };
  
  // Add variability to make numbers less round (±5%)
  const getRandomVariation = () => 1 + ((Math.random() * 10) - 5) / 100;
  
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    // For freemium mode, only one session per day is allowed
    const effectiveSessions = plan === 'freemium' ? Math.min(1, sessionsPerDay) : sessionsPerDay;
    
    // Calculate with plan-specific efficiency factor
    const efficiency = efficiencyFactors[plan as keyof typeof efficiencyFactors];
    
    // Calculate yield per session (higher for premium plans)
    const sessionYield = dailyLimit * efficiency * getRandomVariation();
    
    // Higher plans have better optimization for multiple sessions
    const sessionMultiplier = plan === 'freemium' ? 1 : 
                             plan === 'pro' ? 1.05 : 
                             plan === 'visionnaire' ? 1.12 : 1.18;
    
    // Apply multiplier for multiple sessions (for non-freemium plans)
    const dailyRevenue = Math.min(
      sessionYield * effectiveSessions * (effectiveSessions > 1 ? sessionMultiplier : 1),
      dailyLimit // Always limited by daily ceiling
    );
    
    // Add slight daily variability to avoid round numbers
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
