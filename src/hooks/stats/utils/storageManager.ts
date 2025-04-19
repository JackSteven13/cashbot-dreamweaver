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
    
    localStorage.setItem(STORAGE_KEYS.GLOBAL_ADS_COUNT, adsCount.toString());
    localStorage.setItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT, revenueCount.toString());
    
    return { adsCount, revenueCount };
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
      ],
      revenue: [
        localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT),
        localStorage.getItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT),
        localStorage.getItem('stats_revenue_count'),
        sessionStorage.getItem('displayed_revenue_count'),
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
 * Force la valeur minimale des statistiques et assure la progression continue
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

/**
 * Calculer une progression continue des statistiques basée sur le temps écoulé
 */
export const calculateTimeBasedProgression = () => {
  try {
    // Récupérer la date de départ persistante
    const startDateStr = localStorage.getItem(STORAGE_KEYS.PERSISTENT_START_DATE);
    if (!startDateStr) {
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 jours en arrière
      localStorage.setItem(STORAGE_KEYS.PERSISTENT_START_DATE, startDate.toISOString());
      return { adsBase: 40000, revenueBase: 50000 };
    }
    
    // Calculer le temps écoulé depuis la date de départ
    const startDate = new Date(startDateStr);
    const now = new Date();
    const elapsedDays = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Facteurs de progression moyens par jour
    const averageDailyAdsIncrement = 2000; // En moyenne 2000 publicités par jour
    const averageDailyRevenueIncrement = 500; // En moyenne 500€ par jour
    
    // Calculer les bases avec progression temporelle
    const variationFactor = 0.2 + (Math.sin(elapsedDays / 7) + 1) / 10; // Variation entre 0.2 et 0.4
    const adsBase = 40000 + (elapsedDays * averageDailyAdsIncrement * variationFactor);
    const revenueBase = 50000 + (elapsedDays * averageDailyRevenueIncrement * variationFactor);
    
    return { 
      adsBase: Math.floor(adsBase), 
      revenueBase: Math.floor(revenueBase)
    };
  } catch (error) {
    console.error("Erreur lors du calcul de la progression temporelle:", error);
    return { adsBase: 40000, revenueBase: 50000 };
  }
};

/**
 * Récupère ou génère des valeurs statistiques basées sur la date actuelle
 * pour assurer des valeurs cohérentes et progressives
 */
export const getDateConsistentStats = () => {
  try {
    // D'abord, vérifier les valeurs stockées
    const storedValues = loadStoredValues();
    
    // Si nous avons des valeurs stockées, c'est la source prioritaire
    if (storedValues.hasStoredValues && 
        storedValues.adsCount >= 40000 && 
        storedValues.revenueCount >= 50000) {
      return {
        adsCount: storedValues.adsCount,
        revenueCount: storedValues.revenueCount
      };
    }
    
    // Sinon, calculer des valeurs basées sur la progression temporelle
    const { adsBase, revenueBase } = calculateTimeBasedProgression();
    
    // Ajouter une variation journalière cohérente
    const dailyVariation = generateDateBasedValue() % 1000;
    const adsCount = adsBase + dailyVariation;
    const revenueCount = revenueBase + (dailyVariation / 5);
    
    // Sauvegarder ces valeurs
    saveValues(adsCount, revenueCount);
    
    return { adsCount, revenueCount };
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques cohérentes:", error);
    return { adsCount: 40000, revenueCount: 50000 };
  }
};
