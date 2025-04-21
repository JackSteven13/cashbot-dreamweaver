import { SUBSCRIPTION_LIMITS } from './constants';

/**
 * Strict session limit implementation
 * Ensures users can only start sessions if within their daily limit
 */
export const canStartManualSession = (
  subscription: string,
  sessionCount: number,
  todaysGains: number
): boolean => {
  // Check if daily limit has been reached
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Strict limit check - if already at 95% of the limit, block further sessions
  if (todaysGains >= dailyLimit * 0.95) {
    console.log(`Session blocked: daily gains (${todaysGains}) at or above 95% of limit (${dailyLimit})`);
    return false;
  }
  
  // For freemium accounts, strictly enforce 1 session per day limit
  if (subscription === 'freemium' && sessionCount >= 1) {
    console.log('Session blocked: freemium account already used daily session');
    return false;
  }
  
  return true;
};

/**
 * Strict daily limit implementation
 * Ensures all revenue generation respects daily limits
 */
export const respectsDailyLimit = (
  subscription: string,
  todaysGains: number,
  potentialGain: number
): { allowed: boolean; adjustedGain: number } => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // If adding the potential gain would exceed the limit
  if (todaysGains + potentialGain > dailyLimit) {
    // If already at limit, block the gain entirely
    if (todaysGains >= dailyLimit) {
      console.log(`Gain blocked: daily limit of ${dailyLimit}€ already reached (current: ${todaysGains}€)`);
      return { allowed: false, adjustedGain: 0 };
    }
    
    // Otherwise, adjust the gain to reach exactly the limit
    const adjustedGain = parseFloat((dailyLimit - todaysGains).toFixed(2));
    console.log(`Gain adjusted from ${potentialGain}€ to ${adjustedGain}€ to respect daily limit`);
    return { allowed: true, adjustedGain };
  }
  
  // Gain is within limits
  return { allowed: true, adjustedGain: potentialGain };
};

/**
 * Reset daily counters (sessions, gains) at midnight
 */
export const shouldResetDailyCounters = (lastResetTime: number): boolean => {
  const now = new Date();
  const lastReset = new Date(lastResetTime);
  
  // Reset if last reset was on a different calendar day
  return lastReset.getDate() !== now.getDate() || 
         lastReset.getMonth() !== now.getMonth() ||
         lastReset.getFullYear() !== now.getFullYear();
};

/**
 * Initialize a new day's tracking
 */
export const initializeNewDay = (): number => {
  // Reset daily counters in local storage
  localStorage.setItem('dailySessionCount', '0');
  localStorage.setItem('dailyGains', '0');
  localStorage.setItem('lastResetTime', Date.now().toString());
  
  // Dispatch reset event
  window.dispatchEvent(new CustomEvent('dailyGains:reset'));
  
  return Date.now();
};

/**
 * Force synchronization with transactions from the database
 * This ensures our local tracking matches server data
 */
export const syncDailyGainsWithTransactions = (todaysTransactions: any[]): number => {
  // Calculate total gains from today's transactions
  const totalGains = todaysTransactions.reduce((sum, tx) => {
    return sum + (tx.gain || 0);
  }, 0);
  
  // Update localStorage
  localStorage.setItem('dailyGains', totalGains.toString());
  
  // Dispatch updated event
  window.dispatchEvent(new CustomEvent('dailyGains:updated', {
    detail: { gains: totalGains }
  }));
  
  return totalGains;
};
