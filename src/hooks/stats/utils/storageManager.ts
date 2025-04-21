
/**
 * Utilitaires pour la gestion du stockage des statistiques
 * avec une progression continue au fil du temps
 */

// Valeurs minimales de départ pour assurer des compteurs impressionnants
const MINIMUM_ADS_COUNT = 95000;
const MINIMUM_REVENUE_COUNT = 75000;
const DAILY_PROGRESSIVE_FACTOR = 0.008; // 0.8% d'augmentation par jour

/**
 * Charge les valeurs stockées avec progression temporelle
 */
export const loadStoredValues = () => {
  try {
    const storedAdsCount = localStorage.getItem('stats_ads_count');
    const storedRevenueCount = localStorage.getItem('stats_revenue_count');
    const storageDate = localStorage.getItem('stats_storage_date');
    
    let adsCount = storedAdsCount ? parseInt(storedAdsCount) : MINIMUM_ADS_COUNT;
    let revenueCount = storedRevenueCount ? parseFloat(storedRevenueCount) : MINIMUM_REVENUE_COUNT;
    
    // Appliquer la progression temporelle basée sur le nombre de jours depuis le dernier stockage
    if (storageDate) {
      const daysDifference = getDaysDifference(new Date(storageDate), new Date());
      if (daysDifference > 0) {
        // Progression plus impressionnante dans le temps
        const progressFactor = 1 + (DAILY_PROGRESSIVE_FACTOR * Math.min(daysDifference, 30));
        adsCount = Math.floor(adsCount * progressFactor);
        revenueCount = revenueCount * progressFactor;
        
        // Mise à jour du stockage avec les nouvelles valeurs
        saveValues(adsCount, revenueCount);
      }
    }
    
    // S'assurer que les valeurs restent impressionnantes mais crédibles
    adsCount = Math.min(adsCount, 150000);
    revenueCount = Math.min(revenueCount, 120000);
    
    // Toujours s'assurer que les valeurs minimales sont respectées
    adsCount = Math.max(MINIMUM_ADS_COUNT, adsCount);
    revenueCount = Math.max(MINIMUM_REVENUE_COUNT, revenueCount);
    
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
 * Sauvegarde les valeurs dans le stockage local
 */
export const saveValues = (adsCount: number, revenueCount: number, skipDateUpdate = false) => {
  try {
    // S'assurer des valeurs minimales mais NE PAS ÉCRASER avec la valeur fixe minimale
    const safeAdsCount = Math.max(MINIMUM_ADS_COUNT, adsCount);
    const safeRevenueCount = Math.max(MINIMUM_REVENUE_COUNT, revenueCount);
    
    // Plafonnement à des valeurs crédibles mais impressionnantes
    const cappedAdsCount = Math.min(safeAdsCount, 150000);
    const cappedRevenueCount = Math.min(safeRevenueCount, 120000);
    
    localStorage.setItem('stats_ads_count', cappedAdsCount.toString());
    localStorage.setItem('stats_revenue_count', cappedRevenueCount.toString());
    
    if (!skipDateUpdate) {
      localStorage.setItem('stats_storage_date', new Date().toDateString());
    }
    
    return { safeAdsCount: cappedAdsCount, safeRevenueCount: cappedRevenueCount };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des valeurs :', error);
    return { safeAdsCount: adsCount, safeRevenueCount: revenueCount };
  }
};

/**
 * Incrémente les statistiques en fonction de la date, permettant une progression continue
 */
export const incrementDateLinkedStats = () => {
  const { adsCount, revenueCount } = loadStoredValues();
  
  // Facteur de progression basé sur la date d'installation
  const installDate = localStorage.getItem('first_use_date') || new Date().toISOString();
  const daysSinceInstall = getDaysDifference(new Date(installDate), new Date());
  
  // Plus l'application est utilisée longtemps, plus les incréments sont importants
  const progressFactor = Math.min(1 + (daysSinceInstall * 0.001), 1.5);
  
  // Incréments significatifs
  const adsIncrement = Math.floor(Math.random() * 20) + 10; 
  const revenueIncrement = (Math.random() * 1.2 + 0.5) * progressFactor;
  
  const newAdsCount = adsCount + adsIncrement;
  const newRevenueCount = revenueCount + revenueIncrement;
  
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
 * Récupère les statistiques cohérentes avec la date actuelle
 */
export const getDateConsistentStats = () => {
  const base = loadStoredValues();
  const firstUseDate = localStorage.getItem('first_use_date');
  
  if (!firstUseDate) {
    // Définir la date de première utilisation (60 jours dans le passé pour simuler usage)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 60);
    localStorage.setItem('first_use_date', pastDate.toISOString());
  }
  
  // Progression basée sur le temps écoulé depuis la première utilisation
  const installDate = localStorage.getItem('first_use_date') || new Date().toISOString();
  const daysSinceInstall = getDaysDifference(new Date(installDate), new Date());
  
  // Effet cumulatif: augmentation graduelle pour atteindre des valeurs impressionnantes
  const ageBonus = Math.min(daysSinceInstall * 0.05, 30) / 100; // max +30% après 600 jours
  
  const adsCount = Math.min(Math.floor(base.adsCount * (1 + ageBonus)), 150000);
  const revenueCount = Math.min(base.revenueCount * (1 + ageBonus), 120000);
  
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
