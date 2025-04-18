
// Import the functions utilities needed
import { formatDateForStorage, generateDateBasedValue } from '@/utils/date/dateFormatter';

const STORAGE_KEYS = {
  SESSION_COUNT: 'sessionCount',
  DAILY_GAINS: 'dailyGains',
  LAST_SYNC: 'lastSyncDate',
  USER_STATS_PREFIX: 'userStats_',
  ADS_COUNT: 'stats_ads_count',
  REVENUE_COUNT: 'stats_revenue_count',
  STORAGE_DATE: 'stats_storage_date'
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

/**
 * Load stored statistics values from local storage
 * @returns The stored stats values or default values
 */
export function loadStoredValues() {
  try {
    const storedAdsCount = localStorage.getItem(STORAGE_KEYS.ADS_COUNT);
    const storedRevenueCount = localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT);
    const storedDate = localStorage.getItem(STORAGE_KEYS.STORAGE_DATE);
    
    // Check if we have stored values and they are from today
    const today = new Date().toDateString();
    const hasValidDate = storedDate === today;
    
    if (storedAdsCount && storedRevenueCount) {
      const adsCount = parseFloat(storedAdsCount);
      const revenueCount = parseFloat(storedRevenueCount);
      
      // If values are from today, use them directly
      if (hasValidDate) {
        return {
          adsCount,
          revenueCount,
          hasStoredValues: true
        };
      }
      
      // If not from today, generate new values based on today's date
      const dateBasedValue = generateDateBasedValue();
      return {
        adsCount: Math.max(40000, dateBasedValue * 100),
        revenueCount: Math.max(50000, dateBasedValue / 10),
        hasStoredValues: true
      };
    }
    
    // If no stored values, generate new ones based on today's date
    const dateBasedValue = generateDateBasedValue();
    return {
      adsCount: Math.max(40000, dateBasedValue * 100),
      revenueCount: Math.max(50000, dateBasedValue / 10),
      hasStoredValues: true
    };
  } catch (error) {
    console.error("Error loading stored values:", error);
    return {
      adsCount: 40000,
      revenueCount: 50000,
      hasStoredValues: false
    };
  }
}

/**
 * Increment statistics based on the current date to ensure consistency
 * @returns The updated statistics values
 */
export function incrementDateLinkedStats() {
  try {
    // Get current stored values
    const current = loadStoredValues();
    
    // Generate a small increment based on current date
    const baseValue = generateDateBasedValue();
    const smallIncrement = (baseValue % 100) / 10; // Small value that is consistent for the day
    
    // Calculate increments - more ads than revenue
    const adsIncrement = Math.max(1, Math.round(smallIncrement * 5)); 
    const revenueIncrement = smallIncrement / 100; // Much smaller increment for revenue
    
    // Calculate new values
    const newAdsCount = current.adsCount + adsIncrement;
    const newRevenueCount = current.revenueCount + revenueIncrement;
    
    // Save the new values
    saveValues(newAdsCount, newRevenueCount);
    
    return {
      adsCount: newAdsCount,
      revenueCount: newRevenueCount
    };
  } catch (error) {
    console.error("Error incrementing date-linked stats:", error);
    
    // Return current values in case of error
    const current = loadStoredValues();
    return {
      adsCount: current.adsCount,
      revenueCount: current.revenueCount
    };
  }
}

/**
 * Save statistics values to local storage
 * @param adsCount The ads count to save
 * @param revenueCount The revenue count to save
 * @param partialUpdate Whether to update only one of the values
 */
export function saveValues(adsCount: number, revenueCount: number, partialUpdate = false) {
  try {
    const today = new Date().toDateString();
    
    // If it's a partial update, only update the provided value
    if (partialUpdate) {
      if (adsCount > 0) {
        localStorage.setItem(STORAGE_KEYS.ADS_COUNT, adsCount.toString());
      }
      if (revenueCount > 0) {
        localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, revenueCount.toString());
      }
    } else {
      // Update both values
      localStorage.setItem(STORAGE_KEYS.ADS_COUNT, adsCount.toString());
      localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, revenueCount.toString());
    }
    
    // Always update the storage date
    localStorage.setItem(STORAGE_KEYS.STORAGE_DATE, today);
    
  } catch (error) {
    console.error("Error saving values:", error);
  }
}

/**
 * Add daily gain and return the new total
 * @param gain The gain to add
 * @returns The new daily gains total
 */
export function addDailyGain(gain: number): number {
  try {
    // Get current value
    const currentGainsStr = localStorage.getItem(STORAGE_KEYS.DAILY_GAINS) || '0';
    const currentGains = parseFloat(currentGainsStr);
    
    // Calculate new value
    const newGains = currentGains + gain;
    
    // Save new value
    localStorage.setItem(STORAGE_KEYS.DAILY_GAINS, newGains.toString());
    
    return newGains;
  } catch (error) {
    console.error("Error adding daily gain:", error);
    return 0;
  }
}

/**
 * Get current daily gains
 * @returns The current daily gains total
 */
export function getDailyGains(): number {
  try {
    const currentGainsStr = localStorage.getItem(STORAGE_KEYS.DAILY_GAINS) || '0';
    return parseFloat(currentGainsStr);
  } catch (error) {
    console.error("Error getting daily gains:", error);
    return 0;
  }
}
