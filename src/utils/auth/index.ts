
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

// Fonction désactivée pour éliminer les avertissements de connexion
export const hasValidConnection = async (): Promise<boolean> => {
  return true;
};

// Fonction désactivée pour éliminer les avertissements de résolution DNS
export const checkDnsResolution = async (): Promise<boolean> => {
  return true;
};
