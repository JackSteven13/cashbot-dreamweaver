
import { 
  MINIMUM_ADS_COUNT, 
  MINIMUM_REVENUE_COUNT,
  MAX_ADS_COUNT,
  MAX_REVENUE_COUNT
} from './valueInitializer';
import { getDaysDifference } from './dateUtils';

interface StoredValues {
  adsCount: number;
  revenueCount: number;
  hasStoredValues: boolean;
}

export const loadStoredValues = (): StoredValues => {
  try {
    const storedAdsCount = localStorage.getItem('stats_ads_count');
    const storedRevenueCount = localStorage.getItem('stats_revenue_count');
    const backupAdsCount = localStorage.getItem('stats_ads_count_backup');
    const backupRevenueCount = localStorage.getItem('stats_revenue_count_backup');
    
    let adsCount = storedAdsCount ? parseInt(storedAdsCount) : 
                  backupAdsCount ? parseInt(backupAdsCount) : MINIMUM_ADS_COUNT;
    let revenueCount = storedRevenueCount ? parseFloat(storedRevenueCount) : 
                      backupRevenueCount ? parseFloat(backupRevenueCount) : MINIMUM_REVENUE_COUNT;
    
    adsCount = Math.max(adsCount, MINIMUM_ADS_COUNT);
    revenueCount = Math.max(revenueCount, MINIMUM_REVENUE_COUNT);
    
    const storageDate = localStorage.getItem('stats_storage_date');
    if (storageDate) {
      const daysDifference = getDaysDifference(new Date(storageDate), new Date());
      if (daysDifference > 0) {
        const variationFactor = 0.85 + Math.random() * 0.3;
        const maxDailyAdsIncrease = Math.floor(187 * variationFactor);
        const maxDailyRevenueIncrease = Math.floor(127 * variationFactor);
        
        adsCount = Math.min(
          adsCount + (maxDailyAdsIncrease * Math.min(daysDifference, 3)),
          MAX_ADS_COUNT
        );
        
        revenueCount = Math.min(
          revenueCount + (maxDailyRevenueIncrease * Math.min(daysDifference, 3) * 0.8),
          MAX_REVENUE_COUNT
        );
        
        saveValues(adsCount, revenueCount);
      }
    }
    
    return {
      adsCount: Math.min(adsCount, MAX_ADS_COUNT),
      revenueCount: Math.min(revenueCount, MAX_REVENUE_COUNT),
      hasStoredValues: !!(storedAdsCount && storedRevenueCount)
    };
  } catch (error) {
    console.error('Error loading stored values:', error);
    return {
      adsCount: MINIMUM_ADS_COUNT,
      revenueCount: MINIMUM_REVENUE_COUNT,
      hasStoredValues: false
    };
  }
};

export const saveValues = (adsCount: number, revenueCount: number, skipDateUpdate = false) => {
  try {
    const currentAdsCount = parseInt(localStorage.getItem('stats_ads_count') || '0');
    const currentRevenueCount = parseFloat(localStorage.getItem('stats_revenue_count') || '0');
    
    const safeAdsCount = Math.max(
      Math.min(Math.max(MINIMUM_ADS_COUNT, adsCount), MAX_ADS_COUNT),
      currentAdsCount
    );
    
    const safeRevenueCount = Math.max(
      Math.min(Math.max(MINIMUM_REVENUE_COUNT, revenueCount), MAX_REVENUE_COUNT),
      currentRevenueCount
    );
    
    localStorage.setItem('stats_ads_count', safeAdsCount.toString());
    localStorage.setItem('stats_revenue_count', safeRevenueCount.toString());
    localStorage.setItem('stats_ads_count_backup', safeAdsCount.toString());
    localStorage.setItem('stats_revenue_count_backup', safeRevenueCount.toString());
    localStorage.setItem('last_displayed_ads_count', safeAdsCount.toString());
    localStorage.setItem('last_displayed_revenue_count', safeRevenueCount.toString());
    
    if (!skipDateUpdate) {
      localStorage.setItem('stats_storage_date', new Date().toDateString());
    }
    
    return { safeAdsCount, safeRevenueCount };
  } catch (error) {
    console.error('Error saving values:', error);
    return { safeAdsCount: adsCount, safeRevenueCount: revenueCount };
  }
};
