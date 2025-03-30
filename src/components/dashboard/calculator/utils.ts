
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { SUBSCRIPTION_PRICES } from './constants';

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
  
  // Modified throttling factor that ensures more sessions always result in higher revenue
  // but still maintains some form of diminishing returns for very high usage
  const getThrottlingFactor = (plan: string, sessionsCount: number) => {
    // Define max sessions efficiency for each plan
    const maxEfficiencySessions = {
      'freemium': 1,   // Freemium has hard limit of 1 session
      'starter': 12,   // Efficiency drops after this many sessions
      'gold': 16,
      'elite': 20
    };
    
    const maxSessions = maxEfficiencySessions[plan as keyof typeof maxEfficiencySessions] || 10;
    
    // If under the max efficiency sessions, no throttling
    if (sessionsCount <= maxSessions) {
      return 1.0;
    }
    
    // Calculate diminishing returns for sessions above the max efficiency
    // This ensures more sessions always give more revenue, just at a reduced rate
    const excessSessions = sessionsCount - maxSessions;
    const diminishingFactor = 1 - (excessSessions * 0.05);  // 5% less efficient per session above max
    
    // Ensure we never go below 0.4 (40% efficiency) to maintain increasing returns
    return Math.max(0.4, diminishingFactor);
  };
  
  Object.entries(SUBSCRIPTION_LIMITS).forEach(([plan, dailyLimit]) => {
    try {
      // For freemium mode, only one session per day is allowed
      const effectiveSessions = plan === 'freemium' ? Math.min(1, sessionsPerDay) : sessionsPerDay;
      
      // Calculate with plan-specific efficiency factor
      const baseEfficiency = efficiencyFactors[plan as keyof typeof efficiencyFactors] || 0.5;
      
      // Calculate throttling based on number of sessions, not revenue amount
      const throttlingFactor = getThrottlingFactor(plan, effectiveSessions);
      const efficiency = baseEfficiency * throttlingFactor;
      
      // Calculate yield per session (higher for premium plans)
      const sessionYield = dailyLimit * efficiency * getRandomVariation();
      
      // Higher plans have better optimization for multiple sessions
      const sessionMultiplier = plan === 'freemium' ? 1 : 
                              plan === 'starter' ? 1.05 : 
                              plan === 'gold' ? 1.12 : 1.18;
      
      // Apply multiplier for multiple sessions (for non-freemium plans)
      let dailyRevenue = Math.min(
        sessionYield * effectiveSessions * (effectiveSessions > 1 ? sessionMultiplier : 1),
        dailyLimit * 1.1 // Allow slightly over daily limit to ensure monotonic growth
      );
      
      // Add slight daily variability to avoid round numbers
      let monthlyRevenue = dailyRevenue * daysPerMonth * getRandomVariation();
      
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
