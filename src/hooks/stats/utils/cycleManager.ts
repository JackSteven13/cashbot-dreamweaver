
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';

// Storage keys
const STORAGE_KEYS = {
  RESET_DATE: 'stats_reset_date',
  GLOBAL_RESET_DATE: 'global_stats_reset_date'
};

export const scheduleMidnightReset = (
  resetCallback: () => void,
  dailyAdsTarget: number,
  dailyRevenueTarget: number
): ReturnType<typeof setTimeout> => {
  const timeUntilMidnight = calculateTimeUntilMidnight();
  
  // Convert to hours for logs
  const hoursUntilMidnight = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
  const minutesUntilMidnight = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
  
  console.log(`Next counter reset in ${hoursUntilMidnight} hours and ${minutesUntilMidnight} minutes`);
  
  // Schedule reset with more variable initial values
  return setTimeout(() => {
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem(STORAGE_KEYS.RESET_DATE);
    const globalResetDate = localStorage.getItem(STORAGE_KEYS.GLOBAL_RESET_DATE);
    
    if (lastResetDate === today || globalResetDate === today) {
      console.log("Counters were already reset today, skipping");
      scheduleMidnightReset(resetCallback, dailyAdsTarget, dailyRevenueTarget);
      return;
    }
    
    // More dynamic initial values based on market conditions
    const marketCondition = Math.random(); // Random market condition
    let startPercentage;
    
    if (marketCondition < 0.2) {
      // Slow start (20% chance)
      startPercentage = 0.02 + Math.random() * 0.01;
    } else if (marketCondition < 0.8) {
      // Normal start (60% chance)
      startPercentage = 0.03 + Math.random() * 0.02;
    } else {
      // Strong start (20% chance)
      startPercentage = 0.04 + Math.random() * 0.03;
    }
    
    // Calculate initial values with high variability
    const initialAdsCount = Math.floor(dailyAdsTarget * startPercentage * (0.9 + Math.random() * 0.2));
    const initialRevenueCount = Math.floor(dailyRevenueTarget * startPercentage * (0.9 + Math.random() * 0.2));
    
    localStorage.setItem(STORAGE_KEYS.RESET_DATE, today);
    localStorage.setItem(STORAGE_KEYS.GLOBAL_RESET_DATE, today);
    
    resetCallback();
    
    // Populate with highly variable initial values
    localStorage.setItem('global_ads_count', initialAdsCount.toString());
    localStorage.setItem('global_revenue_count', initialRevenueCount.toString());
    localStorage.setItem('displayed_ads_count', initialAdsCount.toString());
    localStorage.setItem('displayed_revenue_count', initialRevenueCount.toString());
    localStorage.setItem('stats_ads_count', initialAdsCount.toString());
    localStorage.setItem('stats_revenue_count', initialRevenueCount.toString());
    
    // Schedule next reset
    scheduleMidnightReset(resetCallback, dailyAdsTarget, dailyRevenueTarget);
  }, timeUntilMidnight);
};
