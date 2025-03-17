
import { useCallback } from 'react';
import { calculateTimeUntilNextReset } from '@/utils/timeUtils';

interface UseStatsCycleManagementParams {
  setAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

export const useStatsCycleManagement = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsCycleManagementParams) => {
  // Schedule next cycle update
  const scheduleCycleUpdate = useCallback(() => {
    const timeUntilNextReset = calculateTimeUntilNextReset();
    
    // Convert to days for the logs
    const daysUntilReset = Math.floor(timeUntilNextReset / 1000 / 60 / 60 / 24);
    const hoursUntilReset = Math.floor((timeUntilNextReset / 1000 / 60 / 60) % 24);
    
    console.log(`Next counter reset scheduled in ${daysUntilReset} days and ${hoursUntilReset} hours`);
    
    const resetTimeout = setTimeout(() => {
      // Reset counters only at the scheduled reset time
      setAdsCount(0);
      setRevenueCount(0);
      setDisplayedAdsCount(0);
      setDisplayedRevenueCount(0);
      
      // Schedule the next reset
      scheduleCycleUpdate();
    }, timeUntilNextReset);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Ultra-aggressive increments to make counters move at extremely high speeds
  // Ensure revenue increments are directly tied to ad increments
  const incrementCountersRandomly = useCallback(() => {
    // Calculate average revenue per ad
    const avgRevenuePerAd = dailyRevenueTarget / dailyAdsTarget;
    
    // Update calculations for 2ms updates (500 times per second)
    const secondsInDay = 24 * 60 * 60;
    // Extreme multiplier to achieve 200+ ads per second
    const cycleMultiplier = 250; 
    const adsIncrementPerSecond = (dailyAdsTarget * cycleMultiplier) / secondsInDay;
    
    // Extreme randomization for high variation in counter jumps
    const randomFactor = Math.random() * 25 + 25; // Random between 25-50x
    
    // Very high increments per update for ads
    const adsIncrement = Math.ceil(adsIncrementPerSecond * randomFactor / 100);
    
    setAdsCount(prevAdsCount => {
      // Only increment if we haven't reached the target
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      const newAdsCount = Math.min(prevAdsCount + adsIncrement, dailyAdsTarget);
      
      // Update revenue based on new ads processed
      const adsDifference = newAdsCount - prevAdsCount;
      const revenueIncrement = adsDifference * avgRevenuePerAd;
      
      // Update revenue directly based on new ads
      setRevenueCount(prevRevenueCount => {
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        return Math.min(prevRevenueCount + revenueIncrement, dailyRevenueTarget);
      });
      
      return newAdsCount;
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
