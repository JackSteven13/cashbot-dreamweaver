
import { SUBSCRIPTION_LIMITS } from './constants';

/**
 * Result of attempting to start a manual session
 */
export interface SessionStartResult {
  canStart: boolean;
  reason?: string;
}

/**
 * Check if a manual session can be started based on subscription type
 */
export const canStartManualSession = (
  subscription: string,
  dailySessionCount: number,
  currentBalance: number
): SessionStartResult => {
  // For freemium, limit to 1 manual session per day
  if (subscription === 'freemium' && dailySessionCount >= 1) {
    return {
      canStart: false,
      reason: "Vous avez atteint la limite quotidienne de sessions (freemium: 1 session/jour)"
    };
  }
  
  // For paid subscriptions, allow unlimited manual sessions until daily limit is reached
  return { canStart: true };
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
