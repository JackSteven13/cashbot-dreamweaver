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
  GLOBAL_ADS_COUNT: 'global_stats_adsCount',
  GLOBAL_REVENUE_COUNT: 'global_stats_revenueCount',
  PERSISTENT_START_DATE: 'stats_persistent_start_date',
  LAST_DISPLAYED_ADS: 'last_displayed_ads_count',
  LAST_DISPLAYED_REVENUE: 'last_displayed_revenue_count',
};

// Assurer que les données sont stockées dans des formats cohérents
const ensureConsistentDataFormat = () => {
  try {
    // Migrer les anciennes clés vers le nouveau format si nécessaire
    const oldAdsCount = localStorage.getItem('stats_ads_count');
    const oldRevenueCount = localStorage.getItem('stats_revenue_count');
    
    if (oldAdsCount && !localStorage.getItem(STORAGE_KEYS.ADS_COUNT)) {
      localStorage.setItem(STORAGE_KEYS.ADS_COUNT, oldAdsCount);
    }
    
    if (oldRevenueCount && !localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT)) {
      localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, oldRevenueCount);
    }
    
    // Créer une date de départ persistante si elle n'existe pas
    if (!localStorage.getItem(STORAGE_KEYS.PERSISTENT_START_DATE)) {
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 jours en arrière
      localStorage.setItem(STORAGE_KEYS.PERSISTENT_START_DATE, startDate.toISOString());
    }
    
    // Synchroniser les valeurs globales et locales
    const adsCount = parseInt(localStorage.getItem(STORAGE_KEYS.ADS_COUNT) || '40000', 10);
    const revenueCount = parseFloat(localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT) || '50000');
    
    // Stocker également les dernières valeurs affichées
    const lastDisplayedAds = localStorage.getItem(STORAGE_KEYS.LAST_DISPLAYED_ADS);
    const lastDisplayedRevenue = localStorage.getItem(STORAGE_KEYS.LAST_DISPLAYED_REVENUE);
    
    // Si nous avons déjà des valeurs affichées précédemment, les utiliser comme minimum
    const finalAdsCount = lastDisplayedAds ? Math.max(adsCount, parseInt(lastDisplayedAds, 10)) : adsCount;
    const finalRevenueCount = lastDisplayedRevenue ? Math.max(revenueCount, parseFloat(lastDisplayedRevenue)) : revenueCount;
    
    localStorage.setItem(STORAGE_KEYS.GLOBAL_ADS_COUNT, finalAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT, finalRevenueCount.toString());
    localStorage.setItem(STORAGE_KEYS.ADS_COUNT, finalAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, finalRevenueCount.toString());
    
    return { adsCount: finalAdsCount, revenueCount: finalRevenueCount };
  } catch (error) {
    console.error("Erreur lors de la normalisation des données:", error);
    return { adsCount: 40000, revenueCount: 50000 };
  }
};

/**
 * Charge les valeurs stockées avec amélioration de la persistance
 */
export const loadStoredValues = () => {
  try {
    // D'abord, assurer que les données sont en format cohérent
    const { adsCount: initialAdsCount, revenueCount: initialRevenueCount } = ensureConsistentDataFormat();
    
    // Récupérer toutes les sources possibles de valeurs
    const sources = {
      ads: [
        localStorage.getItem(STORAGE_KEYS.ADS_COUNT),
        localStorage.getItem(STORAGE_KEYS.GLOBAL_ADS_COUNT),
        localStorage.getItem('stats_ads_count'),
        sessionStorage.getItem('displayed_ads_count'),
        localStorage.getItem(STORAGE_KEYS.LAST_DISPLAYED_ADS),
      ],
      revenue: [
        localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT),
        localStorage.getItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT),
        localStorage.getItem('stats_revenue_count'),
        sessionStorage.getItem('displayed_revenue_count'),
        localStorage.getItem(STORAGE_KEYS.LAST_DISPLAYED_REVENUE),
      ]
    };
    
    // Trouver les valeurs maximales à partir de toutes les sources
    let maxAdsCount = initialAdsCount;
    let maxRevenueCount = initialRevenueCount;
    
    // Parcourir toutes les sources d'ads count
    sources.ads.forEach(source => {
      if (source) {
        try {
          const value = parseInt(source, 10);
          if (!isNaN(value) && value > maxAdsCount) {
            maxAdsCount = value;
          }
        } catch (e) {
          console.error("Erreur lors de l'analyse d'une valeur ads:", e);
        }
      }
    });
    
    // Parcourir toutes les sources de revenue count
    sources.revenue.forEach(source => {
      if (source) {
        try {
          const value = parseFloat(source);
          if (!isNaN(value) && value > maxRevenueCount) {
            maxRevenueCount = value;
          }
        } catch (e) {
          console.error("Erreur lors de l'analyse d'une valeur revenue:", e);
        }
      }
    });
    
    // Récupérer les valeurs maximales historiques
    const highestValuesStr = localStorage.getItem(STORAGE_KEYS.HIGHEST_VALUES);
    if (highestValuesStr) {
      try {
        const highestValues = JSON.parse(highestValuesStr);
        if (highestValues.ads > maxAdsCount) maxAdsCount = highestValues.ads;
        if (highestValues.revenue > maxRevenueCount) maxRevenueCount = highestValues.revenue;
      } catch (e) {
        console.error("Erreur lors de l'analyse des valeurs maximales:", e);
      }
    }
    
    // Assurer les valeurs minimales
    maxAdsCount = Math.max(40000, maxAdsCount);
    maxRevenueCount = Math.max(50000, maxRevenueCount);
    
    // Persister les valeurs maximales dans toutes les sources
    persistMaxValues(maxAdsCount, maxRevenueCount);
    
    console.log("Using stored values:", {
      adsCount: maxAdsCount,
      revenueCount: maxRevenueCount,
      hasStoredValues: true
    });
    
    return {
      adsCount: maxAdsCount,
      revenueCount: maxRevenueCount,
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
};

/**
 * Persiste les valeurs maximales dans toutes les sources de stockage
 */
const persistMaxValues = (adsCount: number, revenueCount: number) => {
  try {
    // Stocker dans localStorage avec toutes les clés possibles
    localStorage.setItem(STORAGE_KEYS.ADS_COUNT, adsCount.toString());
    localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, revenueCount.toString());
    localStorage.setItem(STORAGE_KEYS.GLOBAL_ADS_COUNT, adsCount.toString());
    localStorage.setItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT, revenueCount.toString());
    localStorage.setItem('stats_ads_count', adsCount.toString());
    localStorage.setItem('stats_revenue_count', revenueCount.toString());
    
    // Stocker également les dernières valeurs affichées
    localStorage.setItem(STORAGE_KEYS.LAST_DISPLAYED_ADS, adsCount.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_DISPLAYED_REVENUE, revenueCount.toString());
    
    // Mettre à jour la date de stockage
    localStorage.setItem(STORAGE_KEYS.STORAGE_DATE, new Date().toDateString());
    
    // Mettre à jour les valeurs maximales historiques
    localStorage.setItem(STORAGE_KEYS.HIGHEST_VALUES, JSON.stringify({
      ads: adsCount,
      revenue: revenueCount
    }));
    
    // Stocker aussi dans sessionStorage pour la session en cours
    try {
      sessionStorage.setItem('displayed_ads_count', adsCount.toString());
      sessionStorage.setItem('displayed_revenue_count', revenueCount.toString());
    } catch (e) {
      console.error("Erreur lors du stockage dans sessionStorage:", e);
    }
  } catch (error) {
    console.error("Erreur lors de la persistance des valeurs maximales:", error);
  }
};

/**
 * Sauvegarde les valeurs dans le stockage avec contrôle de cohérence
 */
export const saveValues = (adsCount: number, revenueCount: number, updateOnlyProvided: boolean = false): void => {
  try {
    // Vérifier les valeurs actuelles dans toutes les sources
    const current = loadStoredValues();
    
    // Ne mettre à jour que si les nouvelles valeurs sont plus grandes
    const finalAdsCount = Math.max(adsCount, current.adsCount);
    const finalRevenueCount = Math.max(revenueCount, current.revenueCount);
    
    // Enregistrer également les valeurs comme dernières affichées
    localStorage.setItem(STORAGE_KEYS.LAST_DISPLAYED_ADS, finalAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_DISPLAYED_REVENUE, finalRevenueCount.toString());
    
    // Persister dans toutes les sources
    persistMaxValues(finalAdsCount, finalRevenueCount);
    
  } catch (error) {
    console.error("Error saving values:", error);
  }
};

/**
 * Incrémente les statistiques en fonction de la date et de l'interaction
 */
export const incrementDateLinkedStats = () => {
  try {
    const { adsCount, revenueCount } = loadStoredValues();
    
    // Facteurs de progression naturelle plus importants
    const dailyAdsIncrement = Math.floor(Math.random() * 50) + 30; // 30-80 ads
    const dailyRevenueIncrement = parseFloat(((Math.random() * 6) + 2).toFixed(2)); // 2-8€
    
    // S'assurer que les incréments ne sont pas trop petits
    const safeAdsIncrement = Math.max(dailyAdsIncrement, 35);
    const safeRevenueIncrement = Math.max(dailyRevenueIncrement, 4);
    
    // Appliquer les incréments progressivement
    const newAdsCount = adsCount + safeAdsIncrement;
    const newRevenueCount = revenueCount + safeRevenueIncrement;
    
    // Sauvegarder en s'assurant que les valeurs ne diminuent jamais
    saveValues(newAdsCount, newRevenueCount);
    
    console.log("Auto-incrément des statistiques");
    
    return { newAdsCount, newRevenueCount };
  } catch (error) {
    console.error("Error incrementing stats:", error);
    return { newAdsCount: 0, newRevenueCount: 0 };
  }
};

/**
 * Vérifie si une réinitialisation quotidienne est nécessaire et l'effectue si besoin
 */
export const checkAndResetDailyStats = (): boolean => {
  try {
    const lastResetStr = localStorage.getItem('stats_last_reset_date');
    const today = new Date().toDateString();
    
    if (lastResetStr !== today) {
      // Nouvelle journée, sauvegarder les dernières valeurs avant la mise à jour
      const current = loadStoredValues();
      
      localStorage.setItem(STORAGE_KEYS.LAST_DISPLAYED_ADS, current.adsCount.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_DISPLAYED_REVENUE, current.revenueCount.toString());
      
      // Mettre à jour la date de dernière réinitialisation
      localStorage.setItem('stats_last_reset_date', today);
      console.log("Réinitialisation quotidienne des statistiques effectuée");
      return true;
    }
    
    console.log("Reset already happened today, skipping");
    return false;
  } catch (error) {
    console.error("Error checking daily stats reset:", error);
    return false;
  }
};

/**
 * S'assure que les valeurs minimales sont respectées pour les statistiques
 */
export const enforceMinimumStats = (minAds: number, minRevenue: number): void => {
  try {
    const current = loadStoredValues();
    
    if (current.adsCount < minAds || current.revenueCount < minRevenue) {
      saveValues(
        Math.max(current.adsCount, minAds),
        Math.max(current.revenueCount, minRevenue)
      );
    }
  } catch (error) {
    console.error("Error enforcing minimum stats:", error);
  }
};

/**
 * Récupère des statistiques cohérentes basées sur la date
 */
export const getDateConsistentStats = () => {
  try {
    // Vérifier la réinitialisation quotidienne
    checkAndResetDailyStats();
    
    // Charger les valeurs stockées
    return loadStoredValues();
  } catch (error) {
    console.error("Error getting date consistent stats:", error);
    return { adsCount: 40000, revenueCount: 50000 };
  }
};

/**
 * Sauvegarde les statistiques de l'utilisateur
 */
export const saveUserStats = (data: any): void => {
  try {
    const { adsCount, revenueCount } = data;
    if (adsCount && revenueCount) {
      saveValues(adsCount, revenueCount);
    }
  } catch (error) {
    console.error("Error saving user stats:", error);
  }
};

/**
 * Ajoute un gain journalier
 */
export const addDailyGain = (gain: number): boolean => {
  try {
    // Récupérer le gain journalier actuel
    const currentGain = getDailyGains();
    
    // Ajouter le nouveau gain
    const newGain = parseFloat((currentGain + gain).toFixed(2));
    
    // Stocker le nouveau gain
    localStorage.setItem(STORAGE_KEYS.DAILY_GAINS, newGain.toString());
    
    return true;
  } catch (error) {
    console.error("Error adding daily gain:", error);
    return false;
  }
};

/**
 * Récupérer les gains journaliers
 */
export const getDailyGains = (subscription: string = 'freemium'): number => {
  try {
    // Récupérer le gain journalier depuis le stockage
    const storedGain = localStorage.getItem(STORAGE_KEYS.DAILY_GAINS);
    const subscriptionSpecificGain = localStorage.getItem(`${STORAGE_KEYS.SUBSCRIPTION_GAINS}${subscription}`);
    
    // Utiliser la valeur la plus élevée
    if (storedGain && subscriptionSpecificGain) {
      return Math.max(parseFloat(storedGain), parseFloat(subscriptionSpecificGain));
    } else if (storedGain) {
      return parseFloat(storedGain);
    } else if (subscriptionSpecificGain) {
      return parseFloat(subscriptionSpecificGain);
    }
    
    return 0;
  } catch (error) {
    console.error("Error getting daily gains:", error);
    return 0;
  }
};
