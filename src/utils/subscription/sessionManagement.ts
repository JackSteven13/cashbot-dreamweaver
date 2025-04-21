
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
  currentDailyGains: number
): SessionStartResult => {
  // Pour freemium, vérifier à la fois la limite de session (1 par jour) et la limite de gains (0,50 €)
  if (subscription === 'freemium') {
    // Vérifier les gains quotidiens actuels pour freemium
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription] || 0.5;
    
    if (currentDailyGains >= dailyLimit) {
      return {
        canStart: false,
        reason: `Limite quotidienne atteinte (${dailyLimit}€/jour). Revenez demain ou passez à un forfait supérieur.`
      };
    }
    
    // Vérifier le nombre de sessions
    if (dailySessionCount >= 1) {
      return {
        canStart: false,
        reason: "Vous avez atteint la limite quotidienne de sessions (freemium: 1 session/jour)"
      };
    }
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
  
  // Pour les comptes freemium, vérifier une dernière fois si le solde est près de la limite
  if (subscription === 'freemium') {
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription] || 0.5;
    const remainingLimit = dailyLimit - currentDailyGains;
    
    // S'il reste moins de 0,10 € pour atteindre la limite
    if (remainingLimit < 0.10) {
      console.log(`Limite presque atteinte: ${currentDailyGains}/${dailyLimit}, reste ${remainingLimit.toFixed(2)}€`);
      // On permet encore la session mais on avertira l'utilisateur
    }
  }
  
  // Pour les abonnements payants, autoriser les sessions jusqu'à la limite quotidienne
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
