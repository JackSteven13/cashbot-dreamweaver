
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
  
  // Check if there's a rate limit currently active (to prevent spam)
  const lastSessionTime = localStorage.getItem('lastSessionTimestamp');
  
  if (lastSessionTime) {
    const lastTime = parseInt(lastSessionTime, 10);
    const now = Date.now();
    const timeDiff = now - lastTime;
    
    // If last session was less than 5 minutes ago, prevent new sessions
    if (timeDiff < 5 * 60 * 1000) {
      const waitTimeMinutes = Math.ceil((5 * 60 * 1000 - timeDiff) / 60000);
      return {
        canStart: false,
        reason: `Veuillez patienter encore ${waitTimeMinutes} minute${waitTimeMinutes > 1 ? 's' : ''} avant de lancer une nouvelle session`
      };
    }
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
