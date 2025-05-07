
// Re-export functions from authentication modules
export { verifyAuth, isUserAuthenticated } from './verificationUtils';
export { 
  getCurrentSession,
  refreshSession,
  forceSignOut
} from './sessionUtils';

// Fonction simple pour vérifier la connectivité réseau
export const hasValidConnection = async (): Promise<boolean> => {
  // Vérification basique de la connectivité
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    // Test rapide avec une API fiable
    const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    });
    return true;
  } catch (error) {
    return navigator.onLine;
  }
};
