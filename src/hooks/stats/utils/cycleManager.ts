
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';

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
    resetCallback();
  }, timeUntilMidnight);
};
