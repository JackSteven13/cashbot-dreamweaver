
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
    console.log("Browser reports offline status");
    return false;
  }
  
  // Utiliser plusieurs domaines pour la vérification
  const testDomains = [
    'https://www.google.com/favicon.ico',
    'https://www.cloudflare.com/favicon.ico',
    'https://www.apple.com/favicon.ico'
  ];
  
  try {
    // Essayer plusieurs domaines avec des timeouts courts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Essayer chaque domaine jusqu'à ce qu'un réponde
    for (const url of testDomains) {
      try {
        const response = await fetch(url, { 
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
          headers: { 
            'Cache-Control': 'no-cache', 
            'Pragma': 'no-cache'
          }
        });
        clearTimeout(timeoutId);
        return true;
      } catch (err) {
        // Continuer avec le domaine suivant
        console.warn(`Connection check failed for ${url}`);
      }
    }
    
    clearTimeout(timeoutId);
    console.error('All connection checks failed');
    return false;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

// Vérification robuste des DNS 
export const checkDnsResolution = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;
  
  const testUrls = [
    'https://www.google.com/favicon.ico',
    'https://www.cloudflare.com/favicon.ico',
    'https://www.akamai.com/favicon.ico'
  ];
  
  try {
    const fetchPromises = testUrls.map(url => 
      fetch(`${url}?_=${Date.now()}`, { 
        mode: 'no-cors', 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      .then(() => true)
      .catch(() => false)
    );
    
    const results = await Promise.all(fetchPromises);
    return results.some(result => result === true);
  } catch (error) {
    console.error('DNS check failed:', error);
    return false;
  }
};
