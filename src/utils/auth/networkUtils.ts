
/**
 * Version ultra simplifiée qui retourne toujours que le réseau est disponible
 * pour éviter les blocages d'authentification liés à des problèmes réseau
 */
export const getNetworkStatus = async (): Promise<{isOnline: boolean}> => {
  return { isOnline: true };
};

/**
 * Version ultra simplifiée qui retourne toujours "online"
 */
export const getConnectionType = (): string => {
  return 'online';
};
