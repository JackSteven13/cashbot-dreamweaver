
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
  
  // Vérifier si la résolution DNS fonctionne en testant un ping vers Supabase
  try {
    // Utiliser une URL qui ne sera pas bloquée par les AD blockers
    const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/rest/v1/', {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      mode: 'cors',
      // Court timeout pour éviter de bloquer trop longtemps
      signal: AbortSignal.timeout(3000)
    });
    
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
                       String(error).includes('network');
    
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
    // Forcer un rechargement des ressources réseau
    const status = await getNetworkStatus(true);
    return status.isOnline && status.dnsWorking;
  } catch (e) {
    console.error("Erreur lors de la tentative de récupération réseau:", e);
    return false;
  }
};
