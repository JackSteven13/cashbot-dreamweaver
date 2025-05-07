
/**
 * Vérification plus robuste de la connectivité réseau
 * @returns Promise<boolean> indiquant si la connexion est active
 */
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  // Vérification basique de la connectivité
  if (!navigator.onLine) {
    console.log("Le navigateur indique qu'il n'y a pas de connexion réseau");
    return false;
  }
  
  try {
    // Test multi-source pour une meilleure précision
    const endpoints = [
      'https://www.cloudflare.com/cdn-cgi/trace',
      'https://www.google.com/generate_204',
      'https://www.apple.com/library/test/success.html'
    ];
    
    // Tester chaque endpoint avec un timeout court
    const testPromises = endpoints.map(url => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      return fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      })
      .then(response => {
        clearTimeout(timeoutId);
        return true;
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.warn(`Échec de la vérification de connectivité sur ${url}:`, error);
        return false;
      });
    });
    
    // Considérer comme en ligne si au moins un endpoint répond
    const results = await Promise.all(testPromises);
    const isConnected = results.some(result => result === true);
    
    console.log(`État de la connectivité réseau: ${isConnected ? 'connecté' : 'déconnecté'}`);
    return isConnected;
  } catch (error) {
    console.error("Erreur lors de la vérification de connectivité:", error);
    // En cas d'erreur, retomber sur navigator.onLine
    return navigator.onLine;
  }
};

/**
 * Version synchrone et immédiate de la vérification de connectivité
 * @returns boolean indiquant si la connexion est probablement active
 */
export const hasNetworkConnectivity = (): boolean => {
  return navigator.onLine;
};
