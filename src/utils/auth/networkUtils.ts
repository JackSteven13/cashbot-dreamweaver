
/**
 * Vérifie l'état du réseau de manière simplifiée
 * Version minimale qui retourne toujours en ligne pour éviter les blocages
 * @returns Une promesse qui résout à un objet indiquant que le réseau est toujours disponible
 */
export const getNetworkStatus = async (): Promise<{isOnline: boolean}> => {
  // Version simplifiée qui retourne toujours true pour éviter les erreurs
  return { isOnline: true };
};

/**
 * Détecte le type de connexion réseau 
 * Version simplifiée qui retourne toujours "online"
 */
export const getConnectionType = (): string => {
  return 'online';
};
