
/**
 * Utilitaires pour la gestion du réseau et la récupération en cas d'erreur
 */

/**
 * Vérifie l'état du réseau et de la résolution DNS
 * @param silentMode Si vrai, ne montre pas de notification à l'utilisateur
 * @returns Une promesse qui résout à un objet contenant l'état de la connexion
 */
export const getNetworkStatus = async (silentMode = false): Promise<{isOnline: boolean, dnsWorking: boolean}> => {
  // Vérifier d'abord si le navigateur est en ligne
  const isOnline = navigator.onLine;
  
  // Si nous sommes offline, pas besoin de vérifier plus loin
  if (!isOnline) {
    console.log("Le navigateur rapporte être hors ligne");
    return { isOnline: false, dnsWorking: false };
  }
  
  // Vérifier si la résolution DNS fonctionne en testant un ping vers Supabase avec un timeout
  try {
    // Utiliser une URL qui ne sera pas bloquée par les AD blockers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes de timeout
    
    const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/rest/v1/', {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const dnsWorking = response.status < 500; // Tout code < 500 signifie que DNS a résolu correctement
    
    if (!dnsWorking && !silentMode) {
      console.error("Erreur de résolution DNS");
    }
    
    return { isOnline: true, dnsWorking };
  } catch (error) {
    // Une erreur de fetch pourrait indiquer un problème DNS ou de connectivité
    if (!silentMode) {
      console.error("Erreur de connexion:", error);
    }
    
    // Si c'est une erreur réseau particulière, marquer DNS comme ne fonctionnant pas
    const isDNSError = String(error).includes('DNS') || 
                       String(error).includes('net::') || 
                       String(error).includes('network') || 
                       String(error).includes('abort');
    
    return { isOnline: true, dnsWorking: !isDNSError };
  }
};

/**
 * Tente de récupérer une session en cas d'échec de connexion
 * @returns true si la récupération a réussi
 */
export const attemptNetworkRecovery = async (): Promise<boolean> => {
  // Attendre un court délai avant d'essayer de récupérer
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    // Faire plusieurs tentatives de récupération
    for (let i = 0; i < 3; i++) {
      // Forcer un rechargement des ressources réseau
      const status = await getNetworkStatus(true);
      if (status.isOnline && status.dnsWorking) {
        return true;
      }
      // Pause entre les tentatives
      await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
    }
    return false;
  } catch (e) {
    console.error("Erreur lors de la tentative de récupération réseau:", e);
    return false;
  }
};

/**
 * Vérifie si une URL est accessible
 * @param url L'URL à vérifier
 * @param timeout Le délai d'attente en millisecondes
 * @returns true si l'URL est accessible
 */
export const isUrlReachable = async (url: string, timeout = 5000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.error(`L'URL ${url} n'est pas accessible:`, error);
    return false;
  }
};
