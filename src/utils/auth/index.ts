
// Re-export functions from authentication modules
export { verifyAuth, isUserAuthenticated } from './verificationUtils';
export { 
  getCurrentSession,
  refreshSession,
  forceSignOut
} from './sessionUtils';

// Import the network connectivity check
import { checkNetworkConnectivity } from '../network/connectivityCheck';

// Fonction pour vérifier la connectivité réseau
export const hasValidConnection = async (): Promise<boolean> => {
  return await checkNetworkConnectivity();
};
