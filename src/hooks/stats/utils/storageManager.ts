
/**
 * Utilitaires pour la gestion du stockage des statistiques
 * avec une progression crédible et stable dans le temps
 */

// Valeurs initiales pour des compteurs crédibles mais attrayants
const MINIMUM_ADS_COUNT = 35000; // Valeur minimale réduite
const MINIMUM_REVENUE_COUNT = 25000; // Valeur minimale réduite
const DAILY_PROGRESSIVE_FACTOR = 0.0005; // 0.05% d'augmentation par jour (bien plus lent)

// Plafonds absolus pour garantir la crédibilité
const MAX_ADS_COUNT = 180000;
const MAX_REVENUE_COUNT = 140000;

/**
 * Charge les valeurs stockées avec progression temporelle limitée
 */
export const loadStoredValues = () => {
  try {
    const storedAdsCount = localStorage.getItem('stats_ads_count');
    const storedRevenueCount = localStorage.getItem('stats_revenue_count');
    const storageDate = localStorage.getItem('stats_storage_date');
    
    let adsCount = storedAdsCount ? parseInt(storedAdsCount) : MINIMUM_ADS_COUNT;
    let revenueCount = storedRevenueCount ? parseFloat(storedRevenueCount) : MINIMUM_REVENUE_COUNT;
    
    // Appliquer une progression temporelle TRÈS limitée basée sur le nombre de jours
    if (storageDate) {
      const daysDifference = getDaysDifference(new Date(storageDate), new Date());
      if (daysDifference > 0) {
        // Progression beaucoup plus lente et plafonnée
        const progressFactor = 1 + (DAILY_PROGRESSIVE_FACTOR * Math.min(daysDifference, 10));
        
        // Limiter l'incrément quotidien à des valeurs très raisonnables
        const maxDailyAdsIncrease = 600; // ~600 pubs par jour maximum
        const maxDailyRevenueIncrease = 500; // ~500€ par jour maximum
        
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
    
    // S'assurer que les valeurs restent crédibles
    adsCount = Math.min(adsCount, MAX_ADS_COUNT);
    revenueCount = Math.min(revenueCount, MAX_REVENUE_COUNT);
    
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
    // Appliquer des limites strictes pour la crédibilité
    const safeAdsCount = Math.min(Math.max(MINIMUM_ADS_COUNT, adsCount), MAX_ADS_COUNT);
    const safeRevenueCount = Math.min(Math.max(MINIMUM_REVENUE_COUNT, revenueCount), MAX_REVENUE_COUNT);
    
    localStorage.setItem('stats_ads_count', safeAdsCount.toString());
    localStorage.setItem('stats_revenue_count', safeRevenueCount.toString());
    
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
 * Incrémente les statistiques de façon TRÈS modérée
 */
export const incrementDateLinkedStats = () => {
  const { adsCount, revenueCount } = loadStoredValues();
  
  // Facteur de progression minimal basé sur la date d'installation
  const installDate = localStorage.getItem('first_use_date') || new Date().toISOString();
  const daysSinceInstall = getDaysDifference(new Date(installDate), new Date());
  
  // Incréments TRÈS petits (presque invisibles en temps réel)
  const adsIncrement = Math.min(Math.floor(Math.random() * 3) + 1, 5); 
  const revenueIncrement = Math.min((Math.random() * 0.03) + 0.01, 0.05);
  
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
  
  // Progression très limitée basée sur le temps écoulé depuis la première utilisation
  const installDate = localStorage.getItem('first_use_date') || new Date().toISOString();
  const daysSinceInstall = getDaysDifference(new Date(installDate), new Date());
  
  // Effet cumulatif très réduit: augmentation très graduelle
  const ageBonus = Math.min(daysSinceInstall * 0.002, 0.15); // max +15% après 75 jours
  
  // Appliquer des limites strictes
  const adsCount = Math.min(Math.floor(base.adsCount * (1 + ageBonus)), MAX_ADS_COUNT);
  const revenueCount = Math.min(base.revenueCount * (1 + ageBonus), MAX_REVENUE_COUNT);
  
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
