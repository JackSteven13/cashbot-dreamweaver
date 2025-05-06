
/**
 * Version désactivée qui ne retourne rien du tout
 * pour supprimer complètement les vérifications
 */
export const getNetworkStatus = async (): Promise<{isOnline: boolean}> => {
  return { isOnline: true };
};

/**
 * Version désactivée
 */
export const getConnectionType = (): string => {
  return '';
};
