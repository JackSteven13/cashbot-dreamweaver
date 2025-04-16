
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
  
  // Schedule reset with initial values
  return setTimeout(() => {
    // Check if a reset has already been performed today
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem(STORAGE_KEYS.RESET_DATE);
    const globalResetDate = localStorage.getItem(STORAGE_KEYS.GLOBAL_RESET_DATE);
    
    // If already reset today, don't reset again
    if (lastResetDate === today || globalResetDate === today) {
      console.log("Counters were already reset today, skipping");
      
      // Schedule next check anyway
      scheduleMidnightReset(resetCallback, dailyAdsTarget, dailyRevenueTarget);
      return;
    }
    
    // Set smaller initial values for a slower start
    const initialAdsCount = Math.floor(dailyAdsTarget * (0.03 + Math.random() * 0.02)); // Reduced from 0.05-0.08 to 0.03-0.05
    const initialRevenueCount = Math.floor(dailyRevenueTarget * (0.03 + Math.random() * 0.02)); // Reduced from 0.05-0.08 to 0.03-0.05
    
    // Store the reset date both locally and globally
    localStorage.setItem(STORAGE_KEYS.RESET_DATE, today);
    localStorage.setItem(STORAGE_KEYS.GLOBAL_RESET_DATE, today);
    
    // Call the reset function
    resetCallback();
    
    // Pre-populate with initial values
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
