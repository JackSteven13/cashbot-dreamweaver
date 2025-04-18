
/**
 * Gestionnaire de stockage pour les statistiques et valeurs
 */
import { formatDateForStorage, generateDateBasedValue } from '@/utils/date/dateFormatter';

// Clés de stockage
const STORAGE_KEYS = {
  ADS_COUNT: 'stats_adsCount',
  REVENUE_COUNT: 'stats_revenueCount',
  DAILY_GAINS: 'stats_dailyGains',
  STORAGE_DATE: 'stats_storage_date',
  SUBSCRIPTION_GAINS: 'subscription_daily_gains_',
};

/**
 * Charge les valeurs stockées
 */
export const loadStoredValues = () => {
  try {
    const storedAdsCount = localStorage.getItem(STORAGE_KEYS.ADS_COUNT);
    const storedRevenueCount = localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT);
    
    if (storedAdsCount && storedRevenueCount) {
      const parsedAds = parseInt(storedAdsCount, 10);
      const parsedRevenue = parseFloat(storedRevenueCount);
      
      if (!isNaN(parsedAds) && !isNaN(parsedRevenue)) {
        console.log("Using stored values:", {
          adsCount: parsedAds,
          revenueCount: parsedRevenue,
          hasStoredValues: true
        });
        
        return {
          adsCount: parsedAds,
          revenueCount: parsedRevenue,
          hasStoredValues: true
        };
      }
    }
  } catch (error) {
    console.error("Error loading stored values:", error);
  }
  
  return {
    adsCount: 0,
    revenueCount: 0,
    hasStoredValues: false
  };
};

/**
 * Sauvegarde les valeurs dans le stockage
 */
export const saveValues = (adsCount: number, revenueCount: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ADS_COUNT, adsCount.toString());
    localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, revenueCount.toString());
  } catch (error) {
    console.error("Error saving values:", error);
  }
};

/**
 * Incrémente les statistiques en fonction de la date
 */
export const incrementDateLinkedStats = () => {
  try {
    const { adsCount, revenueCount } = loadStoredValues();
    
    // Calculer l'incrément basé sur la date
    const dailyAdsIncrement = Math.floor(generateDateBasedValue() / 100) % 90 + 10; // 10-100 ads par jour
    const dailyRevenueIncrement = parseFloat(((generateDateBasedValue() % 400) / 100 + 0.7).toFixed(2)); // 0.7-4.7€ par jour
    
    // Appliquer les incréments
    const newAdsCount = adsCount + dailyAdsIncrement;
    const newRevenueCount = revenueCount + dailyRevenueIncrement;
    
    saveValues(newAdsCount, newRevenueCount);
    
    console.log("Auto-incrément des statistiques");
    return { newAdsCount, newRevenueCount };
  } catch (error) {
    console.error("Erreur lors de l'incrément des statistiques:", error);
    return null;
  }
};

/**
 * Ajoute un gain journalier pour une subscription donnée
 */
export const addDailyGain = (amount: number, subscription = 'freemium'): boolean => {
  try {
    const key = `${STORAGE_KEYS.SUBSCRIPTION_GAINS}${subscription}`;
    const date = formatDateForStorage();
    const dateKey = `${key}_${date}`;
    
    const currentGains = parseFloat(localStorage.getItem(dateKey) || '0');
    const newGains = currentGains + amount;
    
    // Vérifier si le gain ne dépasse pas la limite quotidienne
    const LIMITS: Record<string, number> = {
      'freemium': 0.5,
      'basic': 1.5,
      'premium': 2.5,
      'pro': 7.5,
      'ultimate': 15.0
    };
    
    const limit = LIMITS[subscription] || LIMITS.freemium;
    
    // Si ajout dépasse la limite, ne pas autoriser
    if (newGains > limit) {
      return false;
    }
    
    // Stocker la nouvelle valeur
    localStorage.setItem(dateKey, newGains.toString());
    return true;
  } catch (error) {
    console.error("Error adding daily gain:", error);
    return false;
  }
};

/**
 * Récupère les gains journaliers pour une subscription
 */
export const getDailyGains = (subscription = 'freemium'): number => {
  try {
    const key = `${STORAGE_KEYS.SUBSCRIPTION_GAINS}${subscription}`;
    const date = formatDateForStorage();
    const dateKey = `${key}_${date}`;
    
    const gains = parseFloat(localStorage.getItem(dateKey) || '0');
    return isNaN(gains) ? 0 : gains;
  } catch (error) {
    console.error("Error getting daily gains:", error);
    return 0;
  }
};
