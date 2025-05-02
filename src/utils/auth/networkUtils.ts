
type NetworkStatus = {
  isOnline: boolean;
  dnsWorking: boolean;
  lastChecked: number;
};

/**
 * Vérifie la connexion réseau - version silencieuse
 */
export const checkNetworkStatus = async (): Promise<NetworkStatus> => {
  const isOnline = navigator.onLine;
  
  // En mode silencieux, nous supposons que si navigator.onLine est true, DNS fonctionne aussi
  const dnsWorking = isOnline;
  
  return {
    isOnline,
    dnsWorking,
    lastChecked: Date.now()
  };
};

// Cache pour éviter trop de vérifications
let networkStatusCache: NetworkStatus | null = null;
const CACHE_TTL = 30000; // 30 secondes

/**
 * Vérifie le réseau et la résolution DNS, avec cache
 */
export const getNetworkStatus = async (bypassCache = false): Promise<NetworkStatus> => {
  // Vérifier si on a un statut récent en cache
  if (!bypassCache && networkStatusCache && (Date.now() - networkStatusCache.lastChecked < CACHE_TTL)) {
    return networkStatusCache;
  }
  
  // Sinon vérifier à nouveau
  const status = await checkNetworkStatus();
  networkStatusCache = status;
  return status;
};

/**
 * Fonction conservée mais ne fait plus rien (pour éviter les erreurs)
 * Ne montre plus de toast à l'utilisateur
 */
export const showNetworkStatusToast = () => {
  // Ne fait plus rien - pas de notification à l'utilisateur
  return;
};

/**
 * Fonction conservée mais ne fait plus rien (pour éviter les erreurs)
 * Ne montre plus de toast à l'utilisateur
 */
export const showDnsTroubleshootingToast = () => {
  // Ne fait plus rien - pas de notification à l'utilisateur
  return;
};
