
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
  
  // Extremely aggressive increments to make counters move dramatically faster
  const incrementCountersRandomly = useCallback(() => {
    // Update calculations for 100ms updates (10 times per second)
    const secondsInDay = 24 * 60 * 60;
    // Adjust for 17-day cycle vs daily targets to make numbers more impressive
    const cycleMultiplier = 2.5; // Make it look like we're processing more because of 17-day cycle
    const adsIncrementPerSecond = (dailyAdsTarget * cycleMultiplier) / secondsInDay;
    const revenueIncrementPerSecond = (dailyRevenueTarget * cycleMultiplier) / secondsInDay;
    
    // Add much stronger randomization for extremely dynamic movement
    const randomFactor = Math.random() * 8 + 3; // Random between 3-11x (much higher)
    
    const adsIncrement = Math.ceil(adsIncrementPerSecond * randomFactor * 4); // 4x previous value
    const revenueIncrement = Math.ceil(revenueIncrementPerSecond * randomFactor * 4); // 4x previous value
    
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
