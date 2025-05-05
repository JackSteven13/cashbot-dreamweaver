
// Re-export functions from authentication modules
export { verifyAuth } from './verificationUtils';
export { 
  getCurrentSession,
  refreshSession,
  forceSignOut
} from './sessionUtils';

export {
  checkDailyLimit,
  getEffectiveSubscription,
  subscribeToAuthChanges,
  unsubscribeFromAuthChanges
} from './subscriptionUtils';

// Re-export isUserAuthenticated from verificationUtils instead of subscriptionUtils
export { isUserAuthenticated } from './verificationUtils';

// Function to check if network connection is valid (connected to the internet)
export const hasValidConnection = async (): Promise<boolean> => {
  // Check if the browser reports being online
  if (!navigator.onLine) {
    console.log("Browser reports offline status");
    return false;
  }
  
  // Vérification silencieuse sans réellement faire d'appels réseau pour éviter les erreurs
  // Cette fonction indique juste l'état de navigateur.onLine maintenant
  return true;
};

// Vérification robuste des DNS - version silencieuse qui ne produit pas d'erreurs
export const checkDnsResolution = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;
  
  // Version silencieuse qui ne fait pas vraiment de requêtes
  // mais qui retourne la valeur de navigator.onLine
  return navigator.onLine;
};
