
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
  
  // Schedule reset with natural initial values
  return setTimeout(() => {
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem(STORAGE_KEYS.RESET_DATE);
    const globalResetDate = localStorage.getItem(STORAGE_KEYS.GLOBAL_RESET_DATE);
    
    if (lastResetDate === today || globalResetDate === today) {
      console.log("Counters were already reset today, skipping");
      scheduleMidnightReset(resetCallback, dailyAdsTarget, dailyRevenueTarget);
      return;
    }
    
    // Use much more natural, slower start patterns
    const hourOfDay = new Date().getHours();
    
    // Start with minimal values at night/early morning, gradually increasing as day goes on
    let startPercentage;
    
    if (hourOfDay < 5) {
      // Very early morning (midnight-5AM): minimal start
      startPercentage = 0.0005 + Math.random() * 0.0005; // 0.05-0.1%
    } else if (hourOfDay < 8) {
      // Early morning (5-8AM): slow start
      startPercentage = 0.001 + Math.random() * 0.001; // 0.1-0.2%
    } else if (hourOfDay < 12) {
      // Morning (8AM-noon): gradual ramp-up
      startPercentage = 0.002 + Math.random() * 0.002; // 0.2-0.4%
    } else if (hourOfDay < 17) {
      // Afternoon (noon-5PM): normal activity
      startPercentage = 0.003 + Math.random() * 0.003; // 0.3-0.6%
    } else if (hourOfDay < 21) {
      // Evening (5-9PM): peak time
      startPercentage = 0.004 + Math.random() * 0.003; // 0.4-0.7%
    } else {
      // Night (9PM-midnight): declining
      startPercentage = 0.002 + Math.random() * 0.002; // 0.2-0.4%
    }
    
    // Day of week patterns - more organic
    const dayOfWeek = new Date().getDay(); // 0-6 (Sunday-Saturday)
    let dayFactor = 1;
    
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      dayFactor = 0.7 + Math.random() * 0.2; // 70-90% (slower on weekends)
    } else if (dayOfWeek === 1) { // Monday
      dayFactor = 0.8 + Math.random() * 0.2; // 80-100% (slower start to week)
    } else if (dayOfWeek === 3 || dayOfWeek === 4) { // Wednesday/Thursday peak
      dayFactor = 1.0 + Math.random() * 0.2; // 100-120% (midweek peak)
    }
    
    // Add very slight variations between ads and revenue for natural feel
    const adsDeviation = 0.95 + Math.random() * 0.1; // 95-105%
    const revenueDeviation = 0.93 + Math.random() * 0.14; // 93-107%
    
    // Calculate initial values with much smaller, natural values
    const initialAdsCount = Math.floor(dailyAdsTarget * startPercentage * dayFactor * adsDeviation);
    const initialRevenueCount = Math.floor(dailyRevenueTarget * startPercentage * dayFactor * revenueDeviation);
    
    localStorage.setItem(STORAGE_KEYS.RESET_DATE, today);
    localStorage.setItem(STORAGE_KEYS.GLOBAL_RESET_DATE, today);
    
    resetCallback();
    
    // Populate with natural initial values
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
