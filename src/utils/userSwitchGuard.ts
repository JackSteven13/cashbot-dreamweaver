
import balanceManager from './balance/balanceManager';

/**
 * Nettoie les données de solde lors du changement d'utilisateur
 */
export const cleanUserData = () => {
  // Nettoyer les données du gestionnaire de solde
  balanceManager.cleanupUserBalanceData();
  
  // Nettoyer les clés de localStorage générales
  const keysToCleanup = [
    'currentBalance',
    'lastKnownBalance',
    'highestBalance',
    'dailyGains',
    'userStats',
    'dailySessionCount',
    'lastSessionTimestamp',
    'lastGrowthDate'
  ];
  
  keysToCleanup.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log("User data cleaned successfully for user switch");
};

/**
 * Nettoyage complet de toutes les données utilisateur (logout)
 */
export const purgeAllUserData = () => {
  // Nettoyer d'abord les données du gestionnaire de solde
  balanceManager.cleanupUserBalanceData();
  
  // Clés à préserver même après déconnexion
  const keysToPreserve = [
    'theme',
    'language',
    'first_use_date',
    'stats_ads_count',
    'stats_revenue_count'
  ];
  
  // Récupérer toutes les clés du localStorage
  const allKeys = Object.keys(localStorage);
  
  // Filtrer et supprimer toutes les clés liées aux données utilisateur
  allKeys.forEach(key => {
    // Ne pas supprimer les clés à préserver
    if (!keysToPreserve.includes(key)) {
      localStorage.removeItem(key);
    }
  });
  
  // Effacer aussi le sessionStorage
  sessionStorage.clear();
  
  console.log("All user data purged for logout");
};
