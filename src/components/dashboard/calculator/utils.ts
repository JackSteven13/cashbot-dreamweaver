
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
    'starter': 0.68,
    'gold': 0.85,
    'elite': 0.94
  };
  
  // Add variability to make numbers less round (±5%)
  const getRandomVariation = () => 1 + ((Math.random() * 10) - 5) / 100;
  
  // Import subscription prices from constants
  import { SUBSCRIPTION_PRICES } from './constants';
  
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    try {
      // For freemium mode, only one session per day is allowed
      const effectiveSessions = plan === 'freemium' ? Math.min(1, sessionsPerDay) : sessionsPerDay;
      
      // Calculate with plan-specific efficiency factor
      const efficiency = efficiencyFactors[plan as keyof typeof efficiencyFactors] || 0.5;
      
      // Calculate yield per session (higher for premium plans)
      const sessionYield = dailyLimit * efficiency * getRandomVariation();
      
      // Higher plans have better optimization for multiple sessions
      const sessionMultiplier = plan === 'freemium' ? 1 : 
                              plan === 'starter' ? 1.05 : 
                              plan === 'gold' ? 1.12 : 1.18;
      
      // Apply multiplier for multiple sessions (for non-freemium plans)
      const dailyRevenue = Math.min(
        sessionYield * effectiveSessions * (effectiveSessions > 1 ? sessionMultiplier : 1),
        dailyLimit // Always limited by daily ceiling
      );
      
      // Add slight daily variability to avoid round numbers
      const monthlyRevenue = dailyRevenue * daysPerMonth * getRandomVariation();
      
      const subscriptionPrice = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0;
      
      // Ensure we always have valid numbers
      const finalRevenue = isNaN(monthlyRevenue) ? 0 : monthlyRevenue;
      const finalProfit = isNaN(monthlyRevenue) ? -subscriptionPrice : monthlyRevenue - subscriptionPrice;
      
      results[plan] = {
        revenue: parseFloat(finalRevenue.toFixed(2)),
        profit: parseFloat(finalProfit.toFixed(2))
      };
    } catch (error) {
      console.error(`Error calculating for plan ${plan}:`, error);
      // Fallback to safe default values in case of error
      results[plan] = {
        revenue: 0,
        profit: -(SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0)
      };
    }
  });
  
  return results;
};
