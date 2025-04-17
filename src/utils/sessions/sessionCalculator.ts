
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

/**
 * Calculate session gain based on user's subscription level, daily sessions and bot activity
 * @param subscription User subscription level
 * @param sessionCount Number of sessions today
 * @param activityLevel Current bot activity level (0-100)
 * @returns Calculated gain in euros
 */
export const calculateSessionGain = (
  subscription: string = 'freemium',
  sessionCount: number = 0,
  activityLevel: number = 50
): number => {
  // Base gain values per subscription type
  const baseGainMap: Record<string, number> = {
    'freemium': 0.05,
    'starter': 0.15,
    'gold': 0.35,
    'elite': 0.75
  };
  
  // Get base gain for subscription (default to freemium if unknown)
  const baseGain = baseGainMap[subscription] || baseGainMap.freemium;
  
  // Factor based on daily session count to discourage spamming
  const sessionFactor = Math.max(0.5, 1 - sessionCount * 0.05);
  
  // Factor based on current activity level
  const activityFactor = Math.max(0.5, Math.min(1.5, activityLevel / 50));
  
  // Randomization factor to add variability (0.85-1.15)
  const randomFactor = 0.85 + Math.random() * 0.3;
  
  // Calculate final gain (base * factors), with minimum value
  const calculatedGain = Math.max(
    0.01,
    baseGain * sessionFactor * activityFactor * randomFactor
  );
  
  // Format to 2 decimal places
  return parseFloat(calculatedGain.toFixed(2));
};
