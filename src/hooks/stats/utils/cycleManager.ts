
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
  
  // Schedule reset with completely variable initial values
  return setTimeout(() => {
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem(STORAGE_KEYS.RESET_DATE);
    const globalResetDate = localStorage.getItem(STORAGE_KEYS.GLOBAL_RESET_DATE);
    
    if (lastResetDate === today || globalResetDate === today) {
      console.log("Counters were already reset today, skipping");
      scheduleMidnightReset(resetCallback, dailyAdsTarget, dailyRevenueTarget);
      return;
    }
    
    // Highly varied initial values based on complex market factors
    // First, determine overall market day type with 5 distinct patterns
    const marketPattern = Math.random();
    let startPercentage;
    
    if (marketPattern < 0.05) {
      // Extremely slow start (5% chance)
      startPercentage = 0.005 + Math.random() * 0.01; // 0.5-1.5%
    } else if (marketPattern < 0.25) {
      // Slow start (20% chance)
      startPercentage = 0.015 + Math.random() * 0.015; // 1.5-3%
    } else if (marketPattern < 0.65) {
      // Average start (40% chance)
      startPercentage = 0.03 + Math.random() * 0.02; // 3-5%
    } else if (marketPattern < 0.9) {
      // Strong start (25% chance)
      startPercentage = 0.05 + Math.random() * 0.03; // 5-8%
    } else {
      // Explosive start (10% chance)
      startPercentage = 0.08 + Math.random() * 0.07; // 8-15%
    }
    
    // Add day-of-week effect for more realistic patterns
    const dayOfWeek = new Date().getDay(); // 0-6 (Sunday-Saturday)
    let dayFactor = 1;
    
    // Weekend vs weekday effect
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      dayFactor = 0.7 + Math.random() * 0.6; // 0.7-1.3x (weekends more variable)
    } else if (dayOfWeek === 1 || dayOfWeek === 5) { // Monday/Friday
      dayFactor = 0.85 + Math.random() * 0.3; // 0.85-1.15x
    } else if (dayOfWeek === 3) { // Wednesday peak
      dayFactor = 1.1 + Math.random() * 0.2; // 1.1-1.3x
    }
    
    // Independent randomization for ads and revenue to create natural divergence
    const adsDeviation = 0.8 + Math.random() * 0.4; // 0.8-1.2
    const revenueDeviation = 0.7 + Math.random() * 0.6; // 0.7-1.3
    
    // Calculate initial values with extreme variability
    const initialAdsCount = Math.floor(dailyAdsTarget * startPercentage * dayFactor * adsDeviation);
    const initialRevenueCount = Math.floor(dailyRevenueTarget * startPercentage * dayFactor * revenueDeviation);
    
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
