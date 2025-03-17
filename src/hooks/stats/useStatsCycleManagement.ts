
import { useCallback } from 'react';
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';

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
  // Schedule next cycle update at midnight Paris time
  const scheduleCycleUpdate = useCallback(() => {
    const timeUntilMidnight = calculateTimeUntilMidnight();
    
    // Convert to hours for the logs
    const hoursUntilMidnight = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
    const minutesUntilMidnight = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
    
    console.log(`Next counter reset scheduled in ${hoursUntilMidnight} hours and ${minutesUntilMidnight} minutes`);
    
    const resetTimeout = setTimeout(() => {
      // Reset counters at midnight Paris time
      setAdsCount(0);
      setRevenueCount(0);
      setDisplayedAdsCount(0);
      setDisplayedRevenueCount(0);
      
      // Schedule the next reset
      scheduleCycleUpdate();
    }, timeUntilMidnight);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Much faster increments to show a high-volume global operation
  const incrementCountersRandomly = useCallback(() => {
    // Calculate average revenue per ad
    const avgRevenuePerAd = dailyRevenueTarget / dailyAdsTarget;
    
    // Update calculations for high-frequency operation
    const secondsInDay = 24 * 60 * 60;
    // Very high multiplier to achieve impressive progression
    const cycleMultiplier = 25; 
    const adsIncrementPerSecond = (dailyAdsTarget * cycleMultiplier) / secondsInDay;
    
    // High randomization for dramatic counter movement
    const randomFactor = Math.random() * 3 + 1.5; // Random between 1.5-4.5x
    
    // Much larger increments per update for ads
    const adsIncrement = Math.ceil(adsIncrementPerSecond * randomFactor);
    
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
