
import balanceManager from './balance/balanceManager';

/**
 * Méthode utilitaire pour nettoyer les données utilisateur lors d'un changement d'utilisateur
 */
export const cleanupUserData = () => {
  balanceManager.cleanupUserBalanceData();
  
  // Autres nettoyages possibles
  localStorage.removeItem('lastKnownUsername');
  // etc.
  
  console.log('User data cleanup completed');
};

export default {
  cleanupUserData
};
