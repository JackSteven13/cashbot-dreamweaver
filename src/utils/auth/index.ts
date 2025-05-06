
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
// Version simplifiée qui retourne toujours true pour éviter les faux négatifs
export const hasValidConnection = async (): Promise<boolean> => {
  return true;
};

// Version simplifiée qui retourne toujours true
export const checkDnsResolution = async (): Promise<boolean> => {
  return true;
};
