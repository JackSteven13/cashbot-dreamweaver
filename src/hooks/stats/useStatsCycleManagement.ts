
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
  
  // Faster increments for more responsive updates
  const incrementCountersRandomly = useCallback(() => {
    // Faster calculation for more accurate representation
    // Calculate for 1-second updates 
    const secondsInDay = 24 * 60 * 60;
    const adsIncrementPerSecond = dailyAdsTarget / secondsInDay;
    const revenueIncrementPerSecond = dailyRevenueTarget / secondsInDay;
    
    // Calculate increments for update interval (1 second)
    const adsIncrement = Math.ceil(adsIncrementPerSecond);
    const revenueIncrement = Math.ceil(revenueIncrementPerSecond);
    
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
