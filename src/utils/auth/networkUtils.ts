
type NetworkStatus = {
  isOnline: boolean;
  dnsWorking: boolean;
  lastChecked: number;
};

/**
 * Vérifie la connexion réseau et la résolution DNS
 */
export const checkNetworkStatus = async (): Promise<NetworkStatus> => {
  const isOnline = navigator.onLine;
  let dnsWorking = false;
  
  // Si hors ligne, inutile de tester le DNS
  if (!isOnline) {
    return { isOnline, dnsWorking: false, lastChecked: Date.now() };
  }
  
  try {
    // Test de connectivité avec un timeout court
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Plusieurs domaines de test pour être sûr (avec cache busting)
    const domains = [
      `https://www.google.com/favicon.ico?_=${Date.now()}`,
      `https://www.cloudflare.com/favicon.ico?_=${Date.now()}`
    ];
    
    // Tester différents domaines en parallèle pour plus de fiabilité
    const results = await Promise.allSettled(
      domains.map(url => 
        fetch(url, { 
          mode: 'no-cors', 
          cache: 'no-store',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        })
      )
    );
    
    clearTimeout(timeoutId);
    
    // Si au moins un domaine répond, le DNS fonctionne
    dnsWorking = results.some(result => result.status === 'fulfilled');
    
  } catch (error) {
    console.warn("Network/DNS check failed:", error);
    dnsWorking = false;
  }
  
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
