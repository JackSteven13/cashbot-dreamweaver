
// Clés utilisées pour le stockage local des statistiques
const STORAGE_KEYS = {
  ADS_COUNT: 'stats_ads_count',
  REVENUE_COUNT: 'stats_revenue_count',
  LAST_UPDATE: 'stats_last_update',
  BASE_DATE_SEED: 'stats_base_date_seed',
  DAILY_INCREMENT_ADS: 'stats_daily_increment_ads',
  DAILY_INCREMENT_REVENUE: 'stats_daily_increment_revenue',
  MAX_ADS_COUNT: 'stats_max_ads_count',
  MAX_REVENUE_COUNT: 'stats_max_revenue_count',
  LAST_SYNC_DATE: 'stats_last_sync_date'
};

// Constantes pour les valeurs minimales garanties
const MIN_ADS_COUNT = 40000;
const MIN_REVENUE_COUNT = 50000;

// Facteur de progression quotidien (combien augmenter par jour)
const DAILY_PROGRESSION_FACTOR = 1.05; // +5% par jour

interface StoredValues {
  hasStoredValues: boolean;
  adsCount: number;
  revenueCount: number;
  lastUpdate: number;
}

/**
 * Génère une valeur basée sur la date actuelle
 * Utilise un algorithme déterministe pour que la même date produise toujours la même valeur
 */
const generateDateBasedValue = (baseSeed: number = 42): number => {
  // Récupérer la date actuelle au format YYYYMMDD
  const now = new Date();
  const dateString = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  
  // Créer une graine basée sur la date
  const dateSeed = parseInt(dateString, 10);
  
  // Combiner avec la graine de base pour créer une valeur déterministe
  const deterministicValue = (dateSeed * baseSeed) % 1000000;
  
  // S'assurer que la valeur est dans une plage raisonnable
  return Math.max(MIN_ADS_COUNT, deterministicValue);
};

/**
 * Récupère ou initialise les valeurs maximales atteintes
 */
const getMaxValues = (): { maxAdsCount: number, maxRevenueCount: number } => {
  const storedMaxAds = localStorage.getItem(STORAGE_KEYS.MAX_ADS_COUNT);
  const storedMaxRevenue = localStorage.getItem(STORAGE_KEYS.MAX_REVENUE_COUNT);
  
  return {
    maxAdsCount: storedMaxAds ? parseInt(storedMaxAds, 10) : MIN_ADS_COUNT,
    maxRevenueCount: storedMaxRevenue ? parseFloat(storedMaxRevenue) : MIN_REVENUE_COUNT
  };
};

/**
 * Met à jour les valeurs maximales si nécessaire
 */
const updateMaxValues = (adsCount: number, revenueCount: number): void => {
  const { maxAdsCount, maxRevenueCount } = getMaxValues();
  
  if (adsCount > maxAdsCount) {
    localStorage.setItem(STORAGE_KEYS.MAX_ADS_COUNT, adsCount.toString());
  }
  
  if (revenueCount > maxRevenueCount) {
    localStorage.setItem(STORAGE_KEYS.MAX_REVENUE_COUNT, revenueCount.toString());
  }
};

/**
 * Charge les valeurs stockées ou en génère de nouvelles basées sur la date
 */
export const loadStoredValues = (): StoredValues => {
  try {
    // Récupérer les valeurs stockées
    const storedAdsCount = localStorage.getItem(STORAGE_KEYS.ADS_COUNT);
    const storedRevenueCount = localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT);
    const storedLastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
    
    // Récupérer les valeurs maximales atteintes
    const { maxAdsCount, maxRevenueCount } = getMaxValues();
    
    // Si toutes les valeurs sont disponibles, les utiliser
    if (storedAdsCount && storedRevenueCount && storedLastUpdate) {
      const adsCount = Math.max(maxAdsCount, parseInt(storedAdsCount, 10));
      const revenueCount = Math.max(maxRevenueCount, parseFloat(storedRevenueCount));
      const lastUpdate = parseInt(storedLastUpdate, 10);
      
      console.log("Using stored values:", { hasStoredValues: true, adsCount, revenueCount, lastUpdate });
      
      // Mettre à jour la date de dernière synchronisation
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_DATE, new Date().toDateString());
      
      return {
        hasStoredValues: true,
        adsCount,
        revenueCount,
        lastUpdate
      };
    }
    
    // Si les valeurs ne sont pas disponibles, générer de nouvelles valeurs basées sur la date
    const baseSeed = parseInt(localStorage.getItem(STORAGE_KEYS.BASE_DATE_SEED) || '42', 10);
    const baseAdsCount = generateDateBasedValue(baseSeed);
    
    // Générer un facteur de revenus (entre 1.2 et 1.5 euros par publicité)
    const revenuePerAd = 1.2 + (Math.random() * 0.3);
    const baseRevenueCount = baseAdsCount * revenuePerAd;
    
    // Stocker la graine si elle n'existe pas encore
    if (!localStorage.getItem(STORAGE_KEYS.BASE_DATE_SEED)) {
      localStorage.setItem(STORAGE_KEYS.BASE_DATE_SEED, baseSeed.toString());
    }
    
    // Stocker les incréments journaliers si non définis
    if (!localStorage.getItem(STORAGE_KEYS.DAILY_INCREMENT_ADS)) {
      const dailyIncrement = Math.floor(baseAdsCount * 0.015); // 1.5% par jour
      localStorage.setItem(STORAGE_KEYS.DAILY_INCREMENT_ADS, dailyIncrement.toString());
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.DAILY_INCREMENT_REVENUE)) {
      const dailyIncrement = baseRevenueCount * 0.018; // 1.8% par jour
      localStorage.setItem(STORAGE_KEYS.DAILY_INCREMENT_REVENUE, dailyIncrement.toString());
    }
    
    // Mettre à jour les valeurs maximales
    updateMaxValues(baseAdsCount, baseRevenueCount);
    
    // Sauvegarder les nouvelles valeurs
    saveValues(baseAdsCount, baseRevenueCount);
    
    return {
      hasStoredValues: true,
      adsCount: baseAdsCount,
      revenueCount: baseRevenueCount,
      lastUpdate: Date.now()
    };
  } catch (error) {
    console.error('Error loading stored values:', error);
    
    // En cas d'erreur, retourner des valeurs par défaut
    return {
      hasStoredValues: false,
      adsCount: MIN_ADS_COUNT,
      revenueCount: MIN_REVENUE_COUNT,
      lastUpdate: Date.now()
    };
  }
};

/**
 * Sauvegarde les valeurs dans le stockage local
 */
export const saveValues = (adsCount: number, revenueCount: number, partial: boolean = false): void => {
  try {
    const now = Date.now();
    const { maxAdsCount, maxRevenueCount } = getMaxValues();
    
    // S'assurer que les nouvelles valeurs ne sont pas inférieures aux valeurs maximales
    const safeAdsCount = Math.max(adsCount, maxAdsCount);
    const safeRevenueCount = Math.max(revenueCount, maxRevenueCount);
    
    // Si mise à jour partielle, ne mettre à jour que les valeurs non-nulles
    if (partial) {
      if (safeAdsCount > 0) {
        localStorage.setItem(STORAGE_KEYS.ADS_COUNT, safeAdsCount.toString());
      }
      if (safeRevenueCount > 0) {
        localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, safeRevenueCount.toString());
      }
    } else {
      // Sinon, mettre à jour toutes les valeurs
      localStorage.setItem(STORAGE_KEYS.ADS_COUNT, safeAdsCount.toString());
      localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, safeRevenueCount.toString());
    }
    
    // Mettre à jour les valeurs maximales si nécessaire
    updateMaxValues(safeAdsCount, safeRevenueCount);
    
    // Toujours mettre à jour le timestamp
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, now.toString());
  } catch (error) {
    console.error('Error saving values:', error);
  }
};

/**
 * Incrémente les statistiques en fonction du temps depuis la dernière mise à jour
 * et des facteurs d'incrémentation journaliers
 */
export const incrementDateLinkedStats = (): { adsCount: number, revenueCount: number } => {
  try {
    // Récupérer les valeurs actuelles
    const currentValues = loadStoredValues();
    const now = Date.now();
    const timeDiff = now - currentValues.lastUpdate;
    
    // Convertir la différence en minutes
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Si moins d'une minute s'est écoulée, retourner les valeurs actuelles
    if (minutesDiff < 1) {
      return {
        adsCount: currentValues.adsCount,
        revenueCount: currentValues.revenueCount
      };
    }
    
    // Récupérer les incréments journaliers
    const dailyAdsIncrement = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_INCREMENT_ADS) || '1000', 10);
    const dailyRevenueIncrement = parseFloat(localStorage.getItem(STORAGE_KEYS.DAILY_INCREMENT_REVENUE) || '1500', 10);
    
    // Calculer les incréments par minute
    const adsIncrementPerMinute = dailyAdsIncrement / (24 * 60);
    const revenueIncrementPerMinute = dailyRevenueIncrement / (24 * 60);
    
    // Ajouter une légère variation aléatoire (-10% à +10%)
    const randomFactor = 0.9 + (Math.random() * 0.2);
    
    // Calculer les nouveaux incréments
    const adsIncrement = Math.floor(adsIncrementPerMinute * minutesDiff * randomFactor);
    const revenueIncrement = revenueIncrementPerMinute * minutesDiff * randomFactor;
    
    // Récupérer les valeurs maximales atteintes
    const { maxAdsCount, maxRevenueCount } = getMaxValues();
    
    // Calculer les nouvelles valeurs, jamais inférieures aux maximums précédents
    const newAdsCount = Math.max(currentValues.adsCount + adsIncrement, maxAdsCount);
    const newRevenueCount = Math.max(currentValues.revenueCount + revenueIncrement, maxRevenueCount);
    
    // Sauvegarder les nouvelles valeurs
    saveValues(newAdsCount, newRevenueCount);
    
    // Mettre à jour les incréments journaliers (augmenter légèrement avec le temps)
    const updatedAdsIncrement = Math.floor(dailyAdsIncrement * DAILY_PROGRESSION_FACTOR);
    const updatedRevenueIncrement = dailyRevenueIncrement * DAILY_PROGRESSION_FACTOR;
    
    // Sauvegarder les nouveaux incréments journaliers tous les 3 jours environ
    if (Math.random() < 0.01) { // 1% de chance à chaque appel
      localStorage.setItem(STORAGE_KEYS.DAILY_INCREMENT_ADS, updatedAdsIncrement.toString());
      localStorage.setItem(STORAGE_KEYS.DAILY_INCREMENT_REVENUE, updatedRevenueIncrement.toString());
    }
    
    return {
      adsCount: newAdsCount,
      revenueCount: newRevenueCount
    };
  } catch (error) {
    console.error('Error incrementing date-linked stats:', error);
    
    // En cas d'erreur, retourner les valeurs minimales
    return {
      adsCount: MIN_ADS_COUNT,
      revenueCount: MIN_REVENUE_COUNT
    };
  }
};

/**
 * Réinitialise les statistiques du jour
 */
export const resetDailyStats = (): void => {
  try {
    // Générer de nouvelles valeurs de base pour la nouvelle journée
    const baseSeed = parseInt(localStorage.getItem(STORAGE_KEYS.BASE_DATE_SEED) || '42', 10);
    const baseAdsCount = generateDateBasedValue(baseSeed);
    
    // Générer un facteur de revenus (entre 1.2 et 1.5 euros par publicité)
    const revenuePerAd = 1.2 + (Math.random() * 0.3);
    const baseRevenueCount = baseAdsCount * revenuePerAd;
    
    // Récupérer les valeurs maximales actuelles
    const { maxAdsCount, maxRevenueCount } = getMaxValues();
    
    // Utiliser les valeurs les plus élevées
    const safeAdsCount = Math.max(baseAdsCount, maxAdsCount);
    const safeRevenueCount = Math.max(baseRevenueCount, maxRevenueCount);
    
    // Sauvegarder les nouvelles valeurs
    saveValues(safeAdsCount, safeRevenueCount);
    
    // Calculer de nouveaux incréments journaliers (augmenter légèrement)
    const currentAdsIncrement = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_INCREMENT_ADS) || '1000', 10);
    const currentRevenueIncrement = parseFloat(localStorage.getItem(STORAGE_KEYS.DAILY_INCREMENT_REVENUE) || '1500', 10);
    
    const newAdsIncrement = Math.floor(currentAdsIncrement * DAILY_PROGRESSION_FACTOR);
    const newRevenueIncrement = currentRevenueIncrement * DAILY_PROGRESSION_FACTOR;
    
    localStorage.setItem(STORAGE_KEYS.DAILY_INCREMENT_ADS, newAdsIncrement.toString());
    localStorage.setItem(STORAGE_KEYS.DAILY_INCREMENT_REVENUE, newRevenueIncrement.toString());
  } catch (error) {
    console.error('Error resetting daily stats:', error);
  }
};

