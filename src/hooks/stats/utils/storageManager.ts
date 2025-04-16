
// Storage keys as constants
export const STORAGE_KEYS = {
  GLOBAL_ADS_COUNT: 'global_ads_count',
  GLOBAL_REVENUE_COUNT: 'global_revenue_count',
  ADS_COUNT: 'stats_ads_count',
  REVENUE_COUNT: 'stats_revenue_count',
  LAST_UPDATE: 'stats_last_update',
  RESET_DATE: 'stats_reset_date',
  DISPLAYED_ADS: 'displayed_ads_count',
  DISPLAYED_REVENUE: 'displayed_revenue_count'
};

export const loadStoredValues = () => {
  try {
    // First try to load displayed values (what user actually sees)
    const displayedAds = localStorage.getItem(STORAGE_KEYS.DISPLAYED_ADS);
    const displayedRevenue = localStorage.getItem(STORAGE_KEYS.DISPLAYED_REVENUE);
    
    if (displayedAds && displayedRevenue) {
      const parsedAdsCount = parseInt(displayedAds, 10);
      const parsedRevenueCount = parseInt(displayedRevenue, 10);
      
      if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && parsedAdsCount > 0 && parsedRevenueCount > 0) {
        console.log(`Loaded displayed values: Ads=${parsedAdsCount}, Revenue=${parsedRevenueCount}`);
        return {
          hasStoredValues: true,
          adsCount: parsedAdsCount,
          revenueCount: parsedRevenueCount,
          lastUpdate: Date.now()
        };
      }
    }
    
    // Next try global values (shared between all users)
    const globalAdsCount = localStorage.getItem(STORAGE_KEYS.GLOBAL_ADS_COUNT);
    const globalRevenueCount = localStorage.getItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT);
    
    // If we have global values, use them
    if (globalAdsCount && globalRevenueCount) {
      const parsedAdsCount = parseInt(globalAdsCount, 10);
      const parsedRevenueCount = parseInt(globalRevenueCount, 10);
      
      if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && parsedAdsCount > 0 && parsedRevenueCount > 0) {
        console.log(`Loaded global stored values: Ads=${parsedAdsCount}, Revenue=${parsedRevenueCount}`);
        return {
          hasStoredValues: true,
          adsCount: parsedAdsCount,
          revenueCount: parsedRevenueCount,
          lastUpdate: Date.now()
        };
      }
    }
    
    // Fallback to user-specific values if no global or displayed values
    const storedAdsCount = localStorage.getItem(STORAGE_KEYS.ADS_COUNT);
    const storedRevenueCount = localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT);
    const storedLastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
    
    if (storedAdsCount && storedRevenueCount) {
      const parsedAdsCount = parseInt(storedAdsCount, 10);
      const parsedRevenueCount = parseInt(storedRevenueCount, 10);
      
      if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && parsedAdsCount > 0 && parsedRevenueCount > 0) {
        console.log(`Loaded stored values: Ads=${parsedAdsCount}, Revenue=${parsedRevenueCount}`);
        return {
          hasStoredValues: true,
          adsCount: parsedAdsCount,
          revenueCount: parsedRevenueCount,
          lastUpdate: storedLastUpdate ? parseInt(storedLastUpdate, 10) : Date.now()
        };
      }
    }
    
    // Si aucune valeur valide n'est trouvée, utiliser des valeurs par défaut élevées
    // pour éviter les réinitialisations visuelles à 0
    console.log("No valid stored values found, using default high values");
    const defaultAdsCount = 40000 + Math.floor(Math.random() * 5000);
    const defaultRevenueCount = 50000 + Math.floor(Math.random() * 5000);
    
    // Sauvegarder ces valeurs par défaut pour la cohérence
    try {
      localStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS, defaultAdsCount.toString());
      localStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE, defaultRevenueCount.toString());
      localStorage.setItem(STORAGE_KEYS.GLOBAL_ADS_COUNT, defaultAdsCount.toString());
      localStorage.setItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT, defaultRevenueCount.toString());
    } catch (e) {
      console.error("Error saving default values:", e);
    }
    
    return {
      hasStoredValues: true,
      adsCount: defaultAdsCount,
      revenueCount: defaultRevenueCount,
      lastUpdate: Date.now()
    };
  } catch (e) {
    console.error("Error loading stored values:", e);
    
    // En cas d'erreur, utiliser des valeurs par défaut élevées
    const defaultAdsCount = 40000 + Math.floor(Math.random() * 5000);
    const defaultRevenueCount = 50000 + Math.floor(Math.random() * 5000);
    
    return {
      hasStoredValues: true,
      adsCount: defaultAdsCount,
      revenueCount: defaultRevenueCount,
      lastUpdate: Date.now()
    };
  }
};

export const saveValues = (ads: number, revenue: number) => {
  try {
    // Protection pour éviter les valeurs négatives ou trop basses
    const safeAdsCount = Math.max(40000, Math.round(ads));
    const safeRevenueCount = Math.max(50000, Math.round(revenue));
    
    // Sauvegarder à la fois comme valeurs globales et spécifiques à l'utilisateur
    localStorage.setItem(STORAGE_KEYS.GLOBAL_ADS_COUNT, safeAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT, safeRevenueCount.toString());
    
    localStorage.setItem(STORAGE_KEYS.ADS_COUNT, safeAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, safeRevenueCount.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.RESET_DATE, new Date().toDateString());
    
    // Aussi sauvegarder comme valeurs affichées pour une cohérence immédiate
    localStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS, safeAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE, safeRevenueCount.toString());
  } catch (e) {
    console.error("Error saving values to localStorage:", e);
  }
};
