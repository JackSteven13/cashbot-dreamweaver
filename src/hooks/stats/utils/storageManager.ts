/**
 * Utilitaires pour la gestion du stockage des statistiques
 * avec une progression crédible et stable dans le temps
 */

// Valeurs initiales pour des compteurs crédibles mais attrayants
const MINIMUM_ADS_COUNT = 36742; // Valeur non-ronde plus crédible
const MINIMUM_REVENUE_COUNT = 23918; // Valeur non-ronde plus crédible
const DAILY_PROGRESSIVE_FACTOR = 0.0002; // 0.02% d'augmentation par jour (bien plus lent)

// Plafonds avec des valeurs irrégulières pour plus de crédibilité
const MAX_ADS_COUNT = 152847;
const MAX_REVENUE_COUNT = 116329;

/**
 * Charge les valeurs stockées avec progression temporelle limitée
 */
export const loadStoredValues = () => {
  try {
    const storedAdsCount = localStorage.getItem('stats_ads_count');
    const storedRevenueCount = localStorage.getItem('stats_revenue_count');
    const storageDate = localStorage.getItem('stats_storage_date');
    
    // Utiliser les valeurs de sauvegarde si les principales sont manquantes
    const backupAdsCount = localStorage.getItem('stats_ads_count_backup');
    const backupRevenueCount = localStorage.getItem('stats_revenue_count_backup');
    
    // Obtenir les valeurs effectives à partir de toutes les sources possibles
    let adsCount = storedAdsCount ? parseInt(storedAdsCount) : 
                    backupAdsCount ? parseInt(backupAdsCount) : MINIMUM_ADS_COUNT;
    let revenueCount = storedRevenueCount ? parseFloat(storedRevenueCount) : 
                        backupRevenueCount ? parseFloat(backupRevenueCount) : MINIMUM_REVENUE_COUNT;
    
    // S'assurer que les valeurs sont au moins aux minimums
    adsCount = Math.max(adsCount, MINIMUM_ADS_COUNT);
    revenueCount = Math.max(revenueCount, MINIMUM_REVENUE_COUNT);
    
    // Appliquer une progression temporelle TRÈS limitée basée sur le nombre de jours
    if (storageDate) {
      const daysDifference = getDaysDifference(new Date(storageDate), new Date());
      if (daysDifference > 0) {
        // Progression beaucoup plus lente et plafonnée avec une légère variation
        const progressFactor = 1 + (DAILY_PROGRESSIVE_FACTOR * Math.min(daysDifference, 10));
        
        // Limiter l'incrément quotidien à des valeurs très raisonnables avec variation
        const variationFactor = 0.85 + Math.random() * 0.3; // Entre 0.85 et 1.15
        const maxDailyAdsIncrease = Math.floor(187 * variationFactor); // ~187 pubs par jour maximum
        const maxDailyRevenueIncrease = Math.floor(127 * variationFactor); // ~127€ par jour maximum
        
        const newAdsCount = Math.min(
          adsCount + (maxDailyAdsIncrease * Math.min(daysDifference, 3)),
          MAX_ADS_COUNT
        );
        
        const newRevenueCount = Math.min(
          revenueCount + (maxDailyRevenueIncrease * Math.min(daysDifference, 3) * 0.8),
          MAX_REVENUE_COUNT
        );
        
        adsCount = newAdsCount;
        revenueCount = newRevenueCount;
        
        // Mise à jour du stockage avec les nouvelles valeurs
        saveValues(adsCount, revenueCount);
      }
    }
    
    // S'assurer que les valeurs restent crédibles et ne descendent jamais
    adsCount = Math.min(adsCount, MAX_ADS_COUNT);
    revenueCount = Math.min(revenueCount, MAX_REVENUE_COUNT);
    
    // Créer des sauvegardes secondaires pour éviter les pertes
    localStorage.setItem('stats_ads_count_backup', adsCount.toString());
    localStorage.setItem('stats_revenue_count_backup', revenueCount.toString());
    localStorage.setItem('last_displayed_ads_count', adsCount.toString());
    localStorage.setItem('last_displayed_revenue_count', revenueCount.toString());
    
    return {
      adsCount,
      revenueCount,
      hasStoredValues: !!(storedAdsCount && storedRevenueCount)
    };
  } catch (error) {
    console.error('Erreur lors du chargement des valeurs stockées :', error);
    return {
      adsCount: MINIMUM_ADS_COUNT,
      revenueCount: MINIMUM_REVENUE_COUNT,
      hasStoredValues: false
    };
  }
};

/**
 * Sauvegarde les valeurs dans le stockage local avec des limites strictes
 */
export const saveValues = (adsCount: number, revenueCount: number, skipDateUpdate = false) => {
  try {
    // Récupérer les valeurs actuelles pour éviter toute régression
    const currentAdsCount = parseInt(localStorage.getItem('stats_ads_count') || '0');
    const currentRevenueCount = parseFloat(localStorage.getItem('stats_revenue_count') || '0');
    
    // N'accepter que des valeurs supérieures aux valeurs existantes
    const safeAdsCount = Math.max(
      Math.min(Math.max(MINIMUM_ADS_COUNT, adsCount), MAX_ADS_COUNT),
      currentAdsCount
    );
    
    const safeRevenueCount = Math.max(
      Math.min(Math.max(MINIMUM_REVENUE_COUNT, revenueCount), MAX_REVENUE_COUNT),
      currentRevenueCount
    );
    
    // Stocker dans le stockage principal
    localStorage.setItem('stats_ads_count', safeAdsCount.toString());
    localStorage.setItem('stats_revenue_count', safeRevenueCount.toString());
    
    // Stocker des copies de sauvegarde
    localStorage.setItem('stats_ads_count_backup', safeAdsCount.toString());
    localStorage.setItem('stats_revenue_count_backup', safeRevenueCount.toString());
    
    // Mettre à jour également les dernières valeurs affichées
    localStorage.setItem('last_displayed_ads_count', safeAdsCount.toString());
    localStorage.setItem('last_displayed_revenue_count', safeRevenueCount.toString());
    
    if (!skipDateUpdate) {
      localStorage.setItem('stats_storage_date', new Date().toDateString());
    }
    
    return { safeAdsCount, safeRevenueCount };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des valeurs :', error);
    return { safeAdsCount: adsCount, safeRevenueCount: revenueCount };
  }
};

/**
 * Incrémente les statistiques de façon EXTRÊMEMENT modérée
 */
export const incrementDateLinkedStats = () => {
  const { adsCount, revenueCount } = loadStoredValues();
  
  // Facteur de progression minimal basé sur la date d'installation
  const installDate = localStorage.getItem('first_use_date') || new Date().toISOString();
  const daysSinceInstall = getDaysDifference(new Date(installDate), new Date());
  
  // Incréments TRÈS petits (presque invisibles en temps réel) avec légère variation
  const variationFactor = 0.9 + Math.random() * 0.2; // Entre 0.9 et 1.1
  const adsIncrement = Math.max(1, Math.floor(Math.random() * 2 + 1) * variationFactor); 
  const revenueIncrement = Math.max(0.01, (Math.random() * 0.01 + 0.01) * variationFactor);
  
  const newAdsCount = Math.min(adsCount + adsIncrement, MAX_ADS_COUNT);
  const newRevenueCount = Math.min(revenueCount + revenueIncrement, MAX_REVENUE_COUNT);
  
  saveValues(newAdsCount, newRevenueCount);
  
  return { newAdsCount, newRevenueCount };
};

/**
 * Force le respect des valeurs minimales dans le stockage
 */
export const enforceMinimumStats = (minAds = MINIMUM_ADS_COUNT, minRevenue = MINIMUM_REVENUE_COUNT) => {
  const { adsCount, revenueCount } = loadStoredValues();
  
  if (adsCount < minAds || revenueCount < minRevenue) {
    saveValues(
      Math.max(adsCount, minAds),
      Math.max(revenueCount, minRevenue)
    );
  }
};

/**
 * Récupère les statistiques cohérentes avec la date actuelle, mais avec évolution lente
 */
export const getDateConsistentStats = () => {
  const base = loadStoredValues();
  const firstUseDate = localStorage.getItem('first_use_date');
  
  if (!firstUseDate) {
    // Définir la date de première utilisation (30 jours dans le passé - plus réaliste)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    localStorage.setItem('first_use_date', pastDate.toISOString());
  }
  
  // Progression très limitée basée sur le temps écoulé avec légère variation aléatoire
  const installDate = localStorage.getItem('first_use_date') || new Date().toISOString();
  const daysSinceInstall = getDaysDifference(new Date(installDate), new Date());
  
  // Effet cumulatif très réduit: augmentation très graduelle
  const randomVariation = 0.9 + Math.random() * 0.2; // Entre 0.9 et 1.1
  const ageBonus = Math.min(daysSinceInstall * 0.001 * randomVariation, 0.08); 
  
  // Ajouter une légère variation aléatoire aux valeurs
  const randomAdsFactor = 1 + (Math.random() * 0.002 - 0.001); // ±0.1%
  const randomRevenueFactor = 1 + (Math.random() * 0.002 - 0.001); // ±0.1%
  
  // Appliquer des limites strictes et variation minime
  const adsCount = Math.min(Math.floor(base.adsCount * (1 + ageBonus) * randomAdsFactor), MAX_ADS_COUNT);
  const revenueCount = Math.min(base.revenueCount * (1 + ageBonus) * randomRevenueFactor, MAX_REVENUE_COUNT);
  
  return {
    adsCount,
    revenueCount
  };
};

/**
 * Calcule le nombre de jours entre deux dates
 */
const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Récupère les gains quotidiens
 */
export const getDailyGains = (): number => {
  const gains = localStorage.getItem('dailyGains');
  return gains ? parseFloat(gains) : 0;
};

/**
 * Charge les statistiques utilisateur avec progression temporelle
 */
export const loadUserStats = (subscription: string = 'freemium') => {
  try {
    const statsKey = `user_stats_${subscription}`;
    const stored = localStorage.getItem(statsKey);
    
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Valeurs par défaut avec progression selon abonnement
    return {
      currentGains: 0,
      sessionCount: 0,
      firstDay: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading user stats:', error);
    return {
      currentGains: 0,
      sessionCount: 0,
      firstDay: new Date().toISOString()
    };
  }
};

/**
 * Sauvegarde les statistiques utilisateur
 */
export const saveUserStats = (stats: any) => {
  try {
    const subscription = localStorage.getItem('current_subscription') || 'freemium';
    const statsKey = `user_stats_${subscription}`;
    localStorage.setItem(statsKey, JSON.stringify({
      ...stats,
      lastUpdate: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
};

/**
 * S'assure que les valeurs ne diminuent jamais
 */
export const ensureProgressiveValues = () => {
  try {
    // Récupérer toutes les sources possibles
    const sources = [
      parseInt(localStorage.getItem('stats_ads_count') || '0'),
      parseInt(localStorage.getItem('stats_ads_count_backup') || '0'),
      parseInt(localStorage.getItem('last_displayed_ads_count') || '0'),
      MINIMUM_ADS_COUNT
    ];
    
    const revenueSources = [
      parseFloat(localStorage.getItem('stats_revenue_count') || '0'),
      parseFloat(localStorage.getItem('stats_revenue_count_backup') || '0'),
      parseFloat(localStorage.getItem('last_displayed_revenue_count') || '0'),
      MINIMUM_REVENUE_COUNT
    ];
    
    // Filtrer les valeurs NaN et trouver le maximum
    const maxAds = Math.max(...sources.filter(val => !isNaN(val)));
    const maxRevenue = Math.max(...revenueSources.filter(val => !isNaN(val)));
    
    // S'assurer que toutes les sources sont synchronisées avec la valeur maximale
    localStorage.setItem('stats_ads_count', maxAds.toString());
    localStorage.setItem('stats_ads_count_backup', maxAds.toString());
    localStorage.setItem('last_displayed_ads_count', maxAds.toString());
    
    localStorage.setItem('stats_revenue_count', maxRevenue.toString());
    localStorage.setItem('stats_revenue_count_backup', maxRevenue.toString());
    localStorage.setItem('last_displayed_revenue_count', maxRevenue.toString());
    
    return { maxAds, maxRevenue };
  } catch (error) {
    console.error("Erreur lors de la synchronisation des valeurs maximales:", error);
    return null;
  }
};
