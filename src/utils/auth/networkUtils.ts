
/**
 * Version simplifiée qui retourne toujours que le réseau est en ligne
 * pour éviter les faux négatifs qui bloquent l'accès
 */
export const getNetworkStatus = async (): Promise<{isOnline: boolean}> => {
  return { isOnline: true };
};

/**
 * Version simplifiée qui retourne toujours "online"
 */
export const getConnectionType = (): string => {
  return 'online';
};
