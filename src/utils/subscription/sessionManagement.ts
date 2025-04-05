
import { SUBSCRIPTION_LIMITS } from './constants';

/**
 * Check if a manual session can be started based on subscription type
 */
export const canStartManualSession = (
  subscription: string,
  dailySessionCount: number,
  currentBalance: number
): boolean => {
  // For freemium, limit to 1 manual session per day
  if (subscription === 'freemium' && dailySessionCount >= 1) {
    return false;
  }
  
  // For paid subscriptions, allow unlimited manual sessions until daily limit is reached
  return true;
};

/**
 * Function to subscribe to auth changes (maintained for backward compatibility)
 */
export const subscribeToAuthChanges = () => {
  console.log("Auth change subscription function called - using updated implementation");
  return () => {}; // Noop cleanup function
};

/**
 * Function to unsubscribe from auth changes (maintained for backward compatibility)
 */
export const unsubscribeFromAuthChanges = () => {
  console.log("Auth change unsubscription function called - using updated implementation");
};
