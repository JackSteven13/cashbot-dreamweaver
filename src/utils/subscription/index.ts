
// Export functions related to subscription management
export { 
  shouldResetDailyCounters,
  getEffectiveSubscription, 
  checkDailyLimit
} from './subscriptionStatus';

export { 
  canStartManualSession,
  subscribeToAuthChanges,
  unsubscribeFromAuthChanges
} from './sessionManagement';

export { 
  calculateManualSessionGain, 
  calculateAutoSessionGain,
  calculateSessionGain
} from './sessionGain';

export { 
  calculatePotentialGains,
  calculateAllPlansRevenue 
} from './gainCalculation';

// Re-export constants from constants.ts
export { 
  SUBSCRIPTION_LIMITS, 
  MANUAL_SESSION_GAIN_PERCENTAGES,
  WITHDRAWAL_THRESHOLDS,
  WITHDRAWAL_FEES
} from './constants';

// Re-export interfaces
export type { SessionStartResult } from './sessionManagement';
