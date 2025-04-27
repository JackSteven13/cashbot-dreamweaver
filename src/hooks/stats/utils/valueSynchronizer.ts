
import {
  MINIMUM_ADS_COUNT,
  MINIMUM_REVENUE_COUNT,
  MAX_ADS_COUNT,
  MAX_REVENUE_COUNT
} from './valueInitializer';

export const ensureProgressiveValues = () => {
  try {
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
    
    const maxAds = Math.max(...sources.filter(val => !isNaN(val)));
    const maxRevenue = Math.max(...revenueSources.filter(val => !isNaN(val)));
    
    synchronizeValues(maxAds, maxRevenue);
    
    return { maxAds, maxRevenue };
  } catch (error) {
    console.error("Error synchronizing values:", error);
    return null;
  }
};

const synchronizeValues = (ads: number, revenue: number) => {
  const safeAds = Math.min(Math.max(ads, MINIMUM_ADS_COUNT), MAX_ADS_COUNT);
  const safeRevenue = Math.min(Math.max(revenue, MINIMUM_REVENUE_COUNT), MAX_REVENUE_COUNT);
  
  localStorage.setItem('stats_ads_count', safeAds.toString());
  localStorage.setItem('stats_ads_count_backup', safeAds.toString());
  localStorage.setItem('last_displayed_ads_count', safeAds.toString());
  
  localStorage.setItem('stats_revenue_count', safeRevenue.toString());
  localStorage.setItem('stats_revenue_count_backup', safeRevenue.toString());
  localStorage.setItem('last_displayed_revenue_count', safeRevenue.toString());
};
