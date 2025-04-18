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
  HIGHEST_VALUES: 'stats_highest_values',
};

/**
 * Charge les valeurs stockées
 */
export const loadStoredValues = () => {
  try {
    const storedAdsCount = localStorage.getItem(STORAGE_KEYS.ADS_COUNT);
    const storedRevenueCount = localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT);
    
    // Vérifie également les valeurs maximales historiques
    const highestValuesStr = localStorage.getItem(STORAGE_KEYS.HIGHEST_VALUES);
    let highestAds = 0;
    let highestRevenue = 0;
    
    if (highestValuesStr) {
      try {
        const highestValues = JSON.parse(highestValuesStr);
        highestAds = highestValues.ads || 0;
        highestRevenue = highestValues.revenue || 0;
      } catch (e) {
        console.error("Error parsing highest values:", e);
      }
    }
    
    if (storedAdsCount && storedRevenueCount) {
      const parsedAds = parseInt(storedAdsCount, 10);
      const parsedRevenue = parseFloat(storedRevenueCount);
      
      if (!isNaN(parsedAds) && !isNaN(parsedRevenue)) {
        // Utiliser la plus grande valeur entre celle stockée et la valeur historique maximale
        const finalAdsCount = Math.max(parsedAds, highestAds);
        const finalRevenueCount = Math.max(parsedRevenue, highestRevenue);
        
        // Mettre à jour les valeurs maximales si nécessaire
        if (finalAdsCount > highestAds || finalRevenueCount > highestRevenue) {
          localStorage.setItem(STORAGE_KEYS.HIGHEST_VALUES, JSON.stringify({
            ads: finalAdsCount,
            revenue: finalRevenueCount
          }));
        }
        
        console.log("Using stored values:", {
          adsCount: finalAdsCount,
          revenueCount: finalRevenueCount,
          hasStoredValues: true
        });
        
        return {
          adsCount: finalAdsCount,
          revenueCount: finalRevenueCount,
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
export const saveValues = (adsCount: number, revenueCount: number, updateOnlyProvided: boolean = false): void => {
  try {
    // Vérifier si les nouvelles valeurs sont plus grandes que celles stockées
    const currentAdsCount = localStorage.getItem(STORAGE_KEYS.ADS_COUNT) 
      ? parseInt(localStorage.getItem(STORAGE_KEYS.ADS_COUNT) || '0', 10) 
      : 0;
    
    const currentRevenueCount = localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT)
      ? parseFloat(localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT) || '0')
      : 0;
    
    // Ne mettre à jour que si les nouvelles valeurs sont plus grandes
    if (!updateOnlyProvided || (updateOnlyProvided && adsCount > currentAdsCount)) {
      localStorage.setItem(STORAGE_KEYS.ADS_COUNT, Math.max(adsCount, currentAdsCount).toString());
    }

    if (!updateOnlyProvided || (updateOnlyProvided && revenueCount > currentRevenueCount)) {
      localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, Math.max(revenueCount, currentRevenueCount).toString());
    }
    
    // Mettre à jour également les valeurs maximales historiques
    const highestValuesStr = localStorage.getItem(STORAGE_KEYS.HIGHEST_VALUES);
    let highestAds = 0;
    let highestRevenue = 0;
    
    if (highestValuesStr) {
      try {
        const highestValues = JSON.parse(highestValuesStr);
        highestAds = highestValues.ads || 0;
        highestRevenue = highestValues.revenue || 0;
      } catch (e) {
        console.error("Error parsing highest values:", e);
      }
    }
    
    // Mettre à jour les valeurs maximales si nécessaire
    const newHighestAds = Math.max(adsCount, highestAds);
    const newHighestRevenue = Math.max(revenueCount, highestRevenue);
    
    if (newHighestAds > highestAds || newHighestRevenue > highestRevenue) {
      localStorage.setItem(STORAGE_KEYS.HIGHEST_VALUES, JSON.stringify({
        ads: newHighestAds,
        revenue: newHighestRevenue
      }));
    }
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
    
    // Appliquer les incréments - toujours ajouter, ne jamais diminuer
    const newAdsCount = adsCount + dailyAdsIncrement;
    const newRevenueCount = revenueCount + dailyRevenueIncrement;
    
    // Sauvegarder en s'assurant que les valeurs n'ont pas diminué
    saveValues(newAdsCount, newRevenueCount);
    
    console.log("Auto-incrément des statistiques");
    return { 
      newAdsCount, 
      newRevenueCount 
    };
  } catch (error) {
    console.error("Erreur lors de l'incrément des statistiques:", error);
    return { 
      newAdsCount: 0, 
      newRevenueCount: 0 
    };
  }
};

/**
 * Charge les statistiques utilisateur
 */
export const loadUserStats = (subscription = 'freemium') => {
  try {
    const key = `${STORAGE_KEYS.SUBSCRIPTION_GAINS}${subscription}`;
    const date = formatDateForStorage();
    const dateKey = `${key}_${date}`;
    
    const currentGains = parseFloat(localStorage.getItem(dateKey) || '0');
    const sessionCount = parseInt(localStorage.getItem(`${key}_sessions_${date}`) || '0', 10);
    
    return { 
      currentGains: isNaN(currentGains) ? 0 : currentGains,
      sessionCount: isNaN(sessionCount) ? 0 : sessionCount
    };
  } catch (error) {
    console.error("Error loading user stats:", error);
    return { currentGains: 0, sessionCount: 0 };
  }
};

/**
 * Sauvegarde les statistiques utilisateur
 */
export const saveUserStats = (currentGains: number, sessionCount: number, subscription = 'freemium') => {
  try {
    const key = `${STORAGE_KEYS.SUBSCRIPTION_GAINS}${subscription}`;
    const date = formatDateForStorage();
    const dateKey = `${key}_${date}`;
    const sessionKey = `${key}_sessions_${date}`;
    
    localStorage.setItem(dateKey, currentGains.toString());
    localStorage.setItem(sessionKey, sessionCount.toString());
    
    return true;
  } catch (error) {
    console.error("Error saving user stats:", error);
    return false;
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

/**
 * Force la valeur minimale des statistiques
 */
export const enforceMinimumStats = (minAdsCount: number, minRevenueCount: number) => {
  try {
    const { adsCount, revenueCount } = loadStoredValues();
    
    // Si les valeurs actuelles sont inférieures aux minimums, mettre à jour
    if (adsCount < minAdsCount || revenueCount < minRevenueCount) {
      saveValues(
        Math.max(adsCount, minAdsCount),
        Math.max(revenueCount, minRevenueCount)
      );
      
      console.log("Statistiques minimales appliquées");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de l'application des minimums:", error);
    return false;
  }
};
