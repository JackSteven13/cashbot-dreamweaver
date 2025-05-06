
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
    // Utiliser une requête HEAD pour réduire la charge réseau
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Augmenter le timeout pour les connexions lentes
    
    const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/rest/v1/', {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
    
    // Déterminer si c'est une erreur réseau spécifique
    const isDNSError = String(error).includes('DNS') || 
                       String(error).includes('net::') || 
                       String(error).includes('network') || 
                       String(error).includes('abort') ||
                       String(error).includes('Failed to fetch');
    
    // Pour une URL spécifique, essayer une autre URL de secours
    if (isDNSError && typeof window !== 'undefined') {
      // Si nous sommes sur streamgenius.io, tester une autre URL
      try {
        if (window.location.hostname.includes('streamgenius')) {
          // Tester une connexion alternative
          const altController = new AbortController();
          const altTimeoutId = setTimeout(() => altController.abort(), 4000);
          
          await fetch('https://supabase.co/ping', {
            method: 'HEAD',
            signal: altController.signal,
            mode: 'no-cors'
          });
          
          clearTimeout(altTimeoutId);
          
          // Si cette requête fonctionne, c'est probablement un problème avec Supabase spécifiquement
          return { isOnline: true, dnsWorking: true };
        }
      } catch (err) {
        // Échec également avec l'URL alternative
        console.warn("Échec de connexion alternatif:", err);
      }
    }
    
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
    // Faire plusieurs tentatives de récupération avec délai exponentiel
    for (let i = 0; i < 3; i++) {
      // Forcer un rechargement des ressources réseau avec no-cache
      const status = await getNetworkStatus(true);
      if (status.isOnline && status.dnsWorking) {
        return true;
      }
      
      // Pause entre les tentatives avec backoff exponentiel
      await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, i)));
    }
    
    // Tester avec une autre URL qui n'est pas Supabase
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors',
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      // Si ça fonctionne, c'est probablement un problème spécifique avec Supabase
      console.log("Connexion générale fonctionne, problème spécifique à Supabase");
      return true;
    } catch (e) {
      // Échec de connexion générale
      console.error("Échec de connexion générale:", e);
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
      credentials: 'omit',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.error(`L'URL ${url} n'est pas accessible:`, error);
    return false;
  }
};

/**
 * Détecte le type de connexion réseau
 * @returns Une chaîne décrivant le type de connexion
 */
export const getConnectionType = (): string => {
  if (!navigator.onLine) return 'offline';
  
  // @ts-ignore - navigator.connection est propriétaire mais utile
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!conn) return 'unknown';
  
  // @ts-ignore
  return conn.effectiveType || conn.type || 'unknown';
};
