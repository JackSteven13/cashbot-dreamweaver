
// Import from the subscription module
import { 
  SUBSCRIPTION_LIMITS as SubscriptionLimits, 
  getEffectiveSubscription as getEffectiveSubscriptionOriginal,
  checkDailyLimit as checkDailyLimitOriginal
} from './subscription';

// Re-export the imported functions and constants
export const SUBSCRIPTION_LIMITS = SubscriptionLimits;
export const checkDailyLimit = checkDailyLimitOriginal;
export const getEffectiveSubscription = getEffectiveSubscriptionOriginal;

// Additional functions specific to this file
export const getSubscriptionName = (subscriptionCode: string): string => {
  switch (subscriptionCode) {
    case 'freemium':
      return 'Freemium';
    case 'starter':
      return 'Starter';
    case 'gold':
      return 'Gold';
    case 'elite':
      return 'Elite';
    default:
      return 'Abonnement inconnu';
  }
};

export const getMaxSessionsPerDay = (subscription: string): number => {
  switch (subscription) {
    case 'freemium':
      return 1;
    case 'starter':
      return 10;
    case 'gold':
      return 30;
    case 'elite':
      return 60;
    default:
      return 1;
  }
};

// Add withdrawal threshold utility
export const getWithdrawalThreshold = (subscription: string): number => {
  switch (subscription) {
    case 'freemium':
      return 300;
    case 'starter':
      return 600;
    case 'gold':
      return 1200;
    case 'elite':
      return 2500;
    default:
      return 300;
  }
};
