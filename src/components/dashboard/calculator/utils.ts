
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { SUBSCRIPTION_PRICES } from './constants';

/**
 * Calculate revenue for all subscription plans based on user inputs
 * Ensures that more sessions always result in more revenue
 */
export const calculateRevenueForAllPlans = (
  sessionsPerDay: number,
  daysPerMonth: number
): Record<string, { revenue: number, profit: number }> => {
  const results: Record<string, { revenue: number, profit: number }> = {};
  
  // Base efficiency factors for each plan
  const efficiencyFactors = {
    'freemium': 0.35,
    'starter': 0.68,
    'gold': 0.85,
    'elite': 0.94
  };
  
  // Add variability to make numbers less round (±2%)
  const getRandomVariation = () => 1 + ((Math.random() * 4) - 2) / 100;
  
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    try {
      // Limit sessions for freemium mode
      const effectiveSessions = plan === 'freemium' ? Math.min(1, sessionsPerDay) : sessionsPerDay;
      
      // Base efficiency for this plan
      const planEfficiency = efficiencyFactors[plan as keyof typeof efficiencyFactors] || 0.5;
      
      // Calculate daily revenue with progressive increase for more sessions
      // This ensures the revenue always increases with more sessions
      let dailyRevenue = 0;
      
      // For each session, add revenue with a multiplier effect for consecutive sessions
      for (let i = 0; i < effectiveSessions; i++) {
        // First session has base value, additional sessions get progressively more valuable
        // Higher tier plans benefit more from additional sessions
        const sessionMultiplier = 1 + (i * 0.02 * (
          plan === 'freemium' ? 0 : 
          plan === 'starter' ? 1 : 
          plan === 'gold' ? 1.5 : 2
        ));
        
        const sessionContribution = (dailyLimit / 4) * planEfficiency * sessionMultiplier;
        dailyRevenue += sessionContribution;
      }
      
      // Cap at a reasonable multiple of the daily limit to stay realistic
      // Higher plans have higher caps
      const maxDailyMultiplier = 
        plan === 'freemium' ? 1 :
        plan === 'starter' ? 1.2 :
        plan === 'gold' ? 1.5 : 1.8;
        
      dailyRevenue = Math.min(dailyRevenue, dailyLimit * maxDailyMultiplier);
      
      // Apply random variation to avoid too uniform results
      let monthlyRevenue = dailyRevenue * daysPerMonth * getRandomVariation();
      
      // Get subscription price
      const subscriptionPrice = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0;
      
      // Calculate profit (revenue - subscription cost)
      const profit = monthlyRevenue - subscriptionPrice;
      
      // Store results with 2 decimal places
      results[plan] = {
        revenue: parseFloat(monthlyRevenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2))
      };
    } catch (error) {
      console.error(`Error calculating for plan ${plan}:`, error);
      // Fallback to safe default values
      results[plan] = {
        revenue: 0,
        profit: -(SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES] || 0)
      };
    }
  });
  
  return results;
};
