
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { SUBSCRIPTION_PRICES } from './constants';

/**
 * Calculate revenue for all subscription plans based on user inputs
 * Revised to create more realistic and differentiated results between plans
 * Implements hidden mechanism to reduce gains as they approach thresholds
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
  
  // Throttling factor that reduces earnings as they approach withdrawal thresholds
  const getThrottlingFactor = (plan: string, revenue: number) => {
    // Define thresholds for each plan
    const thresholds = {
      'freemium': 200,
      'starter': 400,
      'gold': 700,
      'elite': 1000
    };
    
    const threshold = thresholds[plan as keyof typeof thresholds] || 200;
    const percentageOfThreshold = (revenue / threshold) * 100;
    
    // Begin reducing at 80% of threshold, cap at 95%
    if (percentageOfThreshold >= 95) {
      return 0.05; // Almost no more revenue
    } else if (percentageOfThreshold >= 90) {
      return 0.3; // 30% of normal revenue
    } else if (percentageOfThreshold >= 85) {
      return 0.5; // 50% of normal revenue
    } else if (percentageOfThreshold >= 80) {
      return 0.7; // 70% of normal revenue
    }
    
    return 1; // Normal revenue
  };
  
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
      let dailyRevenue = Math.min(
        sessionYield * effectiveSessions * (effectiveSessions > 1 ? sessionMultiplier : 1),
        dailyLimit // Always limited by daily ceiling
      );
      
      // Add slight daily variability to avoid round numbers
      let monthlyRevenue = dailyRevenue * daysPerMonth * getRandomVariation();
      
      // Apply throttling to slow down gains near threshold
      const throttlingFactor = getThrottlingFactor(plan, monthlyRevenue);
      if (throttlingFactor < 1) {
        monthlyRevenue *= throttlingFactor;
        console.log(`Applied throttling factor ${throttlingFactor} to ${plan} plan, reducing revenue to ${monthlyRevenue.toFixed(2)}`);
      }
      
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
