
// Fichier simplifié - suppression des vérifications réseau qui causent des problèmes

/**
 * Vérifie l'état du réseau de manière simplifiée
 * @returns Une promesse qui résout à un objet contenant l'état de la connexion
 */
export const getNetworkStatus = async (): Promise<{isOnline: boolean}> => {
  // Version simplifiée qui vérifie juste si le navigateur est en ligne
  const isOnline = navigator.onLine;
  return { isOnline };
};

/**
 * Détecte le type de connexion réseau 
 * Version simplifiée qui retourne juste l'état en ligne/hors ligne
 */
export const getConnectionType = (): string => {
  if (!navigator.onLine) return 'offline';
  return 'online';
};
