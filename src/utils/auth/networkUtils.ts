
/**
 * Version ultra simplifiée des utilitaires réseau
 * Retourne toujours que le réseau est disponible pour éviter les problèmes
 */
export const getNetworkStatus = async (): Promise<{isOnline: boolean}> => {
  return { isOnline: true };
};

/**
 * Version simplifiée du détecteur de type de connexion
 * Retourne toujours "online"
 */
export const getConnectionType = (): string => {
  return 'online';
};
