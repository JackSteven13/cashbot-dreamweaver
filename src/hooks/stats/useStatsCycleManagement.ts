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
  const incrementCountersRandomly = useCallback(() => {
    // Update calculations for 20ms updates (50 times per second)
    const secondsInDay = 24 * 60 * 60;
    // Massive multiplier to achieve 10 ads per second and 15€ per 2 seconds
    const cycleMultiplier = 12; // Dramatically higher multiplier
    const adsIncrementPerSecond = (dailyAdsTarget * cycleMultiplier) / secondsInDay;
    const revenueIncrementPerSecond = (dailyRevenueTarget * cycleMultiplier) / secondsInDay;
    
    // Extreme randomization for high variation in counter jumps
    const randomFactor = Math.random() * 15 + 5; // Random between 5-20x
    
    // Very high increments per update
    const adsIncrement = Math.ceil(adsIncrementPerSecond * randomFactor * 10);
    const revenueIncrement = Math.ceil(revenueIncrementPerSecond * randomFactor * 10);
    
    setAdsCount(prev => {
      // Only increment if we haven't reached the target
      if (prev >= dailyAdsTarget) return dailyAdsTarget;
      return Math.min(prev + adsIncrement, dailyAdsTarget);
    });
    
    setRevenueCount(prev => {
      // Only increment if we haven't reached the target
      if (prev >= dailyRevenueTarget) return dailyRevenueTarget;
      return Math.min(prev + revenueIncrement, dailyRevenueTarget);
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
