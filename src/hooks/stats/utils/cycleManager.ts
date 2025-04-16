
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';

// Clés pour le stockage local
const STORAGE_KEYS = {
  RESET_DATE: 'stats_reset_date'
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
    const initialAdsCount = Math.floor(dailyAdsTarget * (0.10 + Math.random() * 0.05));
    const initialRevenueCount = Math.floor(dailyRevenueTarget * (0.10 + Math.random() * 0.05));
    
    // Stocker la date de réinitialisation
    localStorage.setItem(STORAGE_KEYS.RESET_DATE, new Date().toDateString());
    
    resetCallback();
  }, timeUntilMidnight);
};
