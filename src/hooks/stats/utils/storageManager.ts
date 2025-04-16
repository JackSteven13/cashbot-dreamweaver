
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

// Minimum baseline values that should never be dropped below
const MINIMUM_ADS_COUNT = 40000;
const MINIMUM_REVENUE_COUNT = 50000;

export const loadStoredValues = () => {
  try {
    // First try to load displayed values (what user actually sees)
    const displayedAds = localStorage.getItem(STORAGE_KEYS.DISPLAYED_ADS);
    const displayedRevenue = localStorage.getItem(STORAGE_KEYS.DISPLAYED_REVENUE);
    
    if (displayedAds && displayedRevenue) {
      const parsedAdsCount = parseInt(displayedAds, 10);
      const parsedRevenueCount = parseInt(displayedRevenue, 10);
      
      if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && 
          parsedAdsCount >= MINIMUM_ADS_COUNT && parsedRevenueCount >= MINIMUM_REVENUE_COUNT) {
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
      
      if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && 
          parsedAdsCount >= MINIMUM_ADS_COUNT && parsedRevenueCount >= MINIMUM_REVENUE_COUNT) {
        console.log(`Loaded global stored values: Ads=${parsedAdsCount}, Revenue=${parsedRevenueCount}`);
        return {
          hasStoredValues: true,
          adsCount: parsedAdsCount,
          revenueCount: parsedRevenueCount,
          lastUpdate: Date.now()
        };
      }
    }
    
    // Fallback to baseline values but randomize slightly to look dynamic
    console.log("Using baseline values with slight randomization");
    const baselineAdsCount = MINIMUM_ADS_COUNT + Math.floor(Math.random() * 5000);
    const baselineRevenueCount = MINIMUM_REVENUE_COUNT + Math.floor(Math.random() * 5000);
    
    // Save these baseline values for consistency
    try {
      localStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS, baselineAdsCount.toString());
      localStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE, baselineRevenueCount.toString());
      localStorage.setItem(STORAGE_KEYS.GLOBAL_ADS_COUNT, baselineAdsCount.toString());
      localStorage.setItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT, baselineRevenueCount.toString());
    } catch (e) {
      console.error("Error saving baseline values:", e);
    }
    
    return {
      hasStoredValues: true,
      adsCount: baselineAdsCount,
      revenueCount: baselineRevenueCount,
      lastUpdate: Date.now()
    };
  } catch (e) {
    console.error("Error loading stored values:", e);
    
    // En cas d'erreur, utiliser des valeurs par défaut
    const defaultAdsCount = MINIMUM_ADS_COUNT + Math.floor(Math.random() * 5000);
    const defaultRevenueCount = MINIMUM_REVENUE_COUNT + Math.floor(Math.random() * 5000);
    
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
    const safeAdsCount = Math.max(MINIMUM_ADS_COUNT, Math.round(ads));
    const safeRevenueCount = Math.max(MINIMUM_REVENUE_COUNT, Math.round(revenue));
    
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
