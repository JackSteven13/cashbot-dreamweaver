
// Storage keys as constants
export const STORAGE_KEYS = {
  GLOBAL_ADS_COUNT: 'global_ads_count',
  GLOBAL_REVENUE_COUNT: 'global_revenue_count',
  ADS_COUNT: 'stats_ads_count',
  REVENUE_COUNT: 'stats_revenue_count',
  LAST_UPDATE: 'stats_last_update',
  RESET_DATE: 'stats_reset_date'
};

export const loadStoredValues = () => {
  try {
    // First try to load global values (shared between all users)
    const globalAdsCount = localStorage.getItem(STORAGE_KEYS.GLOBAL_ADS_COUNT);
    const globalRevenueCount = localStorage.getItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT);
    
    // If we have global values, use them as priority
    if (globalAdsCount && globalRevenueCount) {
      const parsedAdsCount = parseInt(globalAdsCount, 10);
      const parsedRevenueCount = parseInt(globalRevenueCount, 10);
      
      if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && parsedAdsCount >= 0 && parsedRevenueCount >= 0) {
        console.log(`Loaded global stored values: Ads=${parsedAdsCount}, Revenue=${parsedRevenueCount}`);
        return {
          hasStoredValues: true,
          adsCount: parsedAdsCount,
          revenueCount: parsedRevenueCount,
          lastUpdate: Date.now()
        };
      }
    }
    
    // Fallback to user-specific values if no global values
    const storedAdsCount = localStorage.getItem(STORAGE_KEYS.ADS_COUNT);
    const storedRevenueCount = localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT);
    const storedLastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
    
    if (storedAdsCount && storedRevenueCount) {
      const parsedAdsCount = parseInt(storedAdsCount, 10);
      const parsedRevenueCount = parseInt(storedRevenueCount, 10);
      
      if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && parsedAdsCount >= 0 && parsedRevenueCount >= 0) {
        console.log(`Loaded stored values: Ads=${parsedAdsCount}, Revenue=${parsedRevenueCount}`);
        return {
          hasStoredValues: true,
          adsCount: parsedAdsCount,
          revenueCount: parsedRevenueCount,
          lastUpdate: storedLastUpdate ? parseInt(storedLastUpdate, 10) : Date.now()
        };
      }
    }
    return { hasStoredValues: false };
  } catch (e) {
    console.error("Error loading stored values:", e);
    return { hasStoredValues: false };
  }
};

export const saveValues = (ads: number, revenue: number) => {
  try {
    // Ensure positive values before saving
    const safeAdsCount = Math.max(0, Math.round(ads));
    const safeRevenueCount = Math.max(0, Math.round(revenue));
    
    // Save both as global and user-specific values
    localStorage.setItem(STORAGE_KEYS.GLOBAL_ADS_COUNT, safeAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT, safeRevenueCount.toString());
    
    localStorage.setItem(STORAGE_KEYS.ADS_COUNT, safeAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, safeRevenueCount.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.RESET_DATE, new Date().toDateString());
    
    // Also save as displayed counts for immediate consistency
    localStorage.setItem('displayed_ads_count', safeAdsCount.toString());
    localStorage.setItem('displayed_revenue_count', safeRevenueCount.toString());
  } catch (e) {
    console.error("Error saving values to localStorage:", e);
  }
};
