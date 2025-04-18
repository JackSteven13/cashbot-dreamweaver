
// Importer les fonctions utilitaires nécessaires
import { formatDateForStorage, generateDateBasedValue } from '@/utils/date/dateFormatter';

const STORAGE_KEYS = {
  SESSION_COUNT: 'sessionCount',
  DAILY_GAINS: 'dailyGains',
  LAST_SYNC: 'lastSyncDate',
  USER_STATS_PREFIX: 'userStats_'
};

/**
 * Charge les statistiques utilisateur depuis le stockage local
 * @param {string} subscription Type d'abonnement pour calculer la limite
 * @returns Les statistiques de l'utilisateur
 */
export function loadUserStats(subscription = 'freemium') {
  try {
    // Vérifier si nous avons des statistiques stockées
    const today = new Date().toDateString();
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    
    // Si c'est un nouveau jour, réinitialiser les compteurs
    if (lastSync !== today) {
      return {
        sessionCount: 0,
        currentGains: 0,
        dailyLimit: getDailyLimitForSubscription(subscription),
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Récupérer les données stockées
    const sessionCountStr = localStorage.getItem(STORAGE_KEYS.SESSION_COUNT);
    const dailyGainsStr = localStorage.getItem(STORAGE_KEYS.DAILY_GAINS);
    
    return {
      sessionCount: sessionCountStr ? parseInt(sessionCountStr, 10) : 0,
      currentGains: dailyGainsStr ? parseFloat(dailyGainsStr) : 0,
      dailyLimit: getDailyLimitForSubscription(subscription),
      lastUpdated: lastSync ? new Date(lastSync).toISOString() : new Date().toISOString()
    };
  } catch (error) {
    console.error("Erreur lors du chargement des statistiques utilisateur:", error);
    return {
      sessionCount: 0,
      currentGains: 0,
      dailyLimit: getDailyLimitForSubscription(subscription),
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Enregistre les statistiques utilisateur dans le stockage local
 * @param {number} currentGains Montant total des gains quotidiens
 * @param {number} sessionCount Nombre total de sessions quotidiennes
 */
export function saveUserStats(currentGains: number, sessionCount: number) {
  try {
    const today = new Date().toDateString();
    
    localStorage.setItem(STORAGE_KEYS.SESSION_COUNT, sessionCount.toString());
    localStorage.setItem(STORAGE_KEYS.DAILY_GAINS, currentGains.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, today);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des statistiques utilisateur:", error);
  }
}

/**
 * Obtient la limite quotidienne en fonction du type d'abonnement
 * @param {string} subscription Type d'abonnement
 * @returns {number} Limite quotidienne en euros
 */
export function getDailyLimitForSubscription(subscription = 'freemium'): number {
  switch (subscription) {
    case 'premium':
      return 2.5;
    case 'pro':
      return 7.5;
    case 'ultimate':
      return 15.0;
    case 'freemium':
    default:
      return 0.5;
  }
}

/**
 * Réinitialise les compteurs quotidiens
 */
export function resetDailyCounts(): void {
  try {
    // Date du jour pour marquer la réinitialisation
    const today = new Date().toDateString();
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, today);
    
    // Réinitialiser les compteurs
    localStorage.setItem(STORAGE_KEYS.SESSION_COUNT, '0');
    localStorage.setItem(STORAGE_KEYS.DAILY_GAINS, '0');
    
    // Propager l'événement pour informer l'application
    window.dispatchEvent(new CustomEvent('stats:reset-daily'));
  } catch (error) {
    console.error("Erreur lors de la réinitialisation des compteurs quotidiens:", error);
  }
}
