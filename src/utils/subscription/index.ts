
// Exports from constants.ts
export { SUBSCRIPTION_LIMITS, MANUAL_SESSION_GAIN_PERCENTAGES } from './constants';

// Exports from sessionGain.ts
export { calculateManualSessionGain, calculateAutoSessionGain } from './sessionGain';

// Exports from sessionManagement.ts
export { 
  respectsDailyLimit,
  shouldResetDailyCounters,
  canStartManualSession
} from './sessionManagement';

/**
 * Get the effective subscription type (accounting for trials, etc.)
 */
export const getEffectiveSubscription = (subscription: string) => {
  // For now, we just return the subscription as is
  // In the future, this could check for trial status or other modifiers
  return subscription;
};

// Export daily limit checking function
export const checkDailyLimit = (balance: number, subscription: string) => {
  const limit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  return balance >= limit;
};
