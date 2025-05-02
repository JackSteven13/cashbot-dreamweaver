
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
  unsubscribeFromAuthChanges,
  isUserAuthenticated
} from './subscriptionUtils';

// Function to check if network connection is valid (connected to the internet)
export const hasValidConnection = async (): Promise<boolean> => {
  // Check if the browser reports being online
  if (!navigator.onLine) {
    return false;
  }
  
  // Additional check by trying to load a small resource
  try {
    const response = await fetch('https://www.google.com/favicon.ico', { 
      mode: 'no-cors',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    return true;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};
