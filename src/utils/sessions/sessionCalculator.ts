
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
  // Base gain values per subscription type (reduced for freemium)
  const baseGainMap: Record<string, number> = {
    'freemium': 0.05, // Gain réduit pour freemium
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
  
  // Pour les comptes freemium, limiter strictement à 0,50€ par jour
  if (subscription === 'freemium') {
    // Vérifier les gains quotidiens actuels
    const dailyGainsString = localStorage.getItem('stats_daily_gains');
    const dailyGains = dailyGainsString ? parseFloat(dailyGainsString) : 0;
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription] || 0.5;
    
    // S'il a déjà atteint la limite, renvoyer 0
    if (dailyGains >= dailyLimit) {
      return 0;
    }
    
    // Limiter le gain pour ne pas dépasser la limite quotidienne
    const remainingAllowed = dailyLimit - dailyGains;
    const calculatedGain = Math.min(
      remainingAllowed,
      baseGain * sessionFactor * activityFactor * randomFactor
    );
    
    // Format to 2 decimal places
    return parseFloat(calculatedGain.toFixed(2));
  }
  
  // Pour les autres abonnements, calcul normal
  const calculatedGain = Math.max(
    0.01,
    baseGain * sessionFactor * activityFactor * randomFactor
  );
  
  // Format to 2 decimal places
  return parseFloat(calculatedGain.toFixed(2));
};
