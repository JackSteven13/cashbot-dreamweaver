
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
  
  // Increment the counters in a more stable way
  const incrementCountersRandomly = useCallback(() => {
    // Calculate more stable increments for steady progression
    const adsHourlyIncrement = dailyAdsTarget / 24;
    const revenueHourlyIncrement = dailyRevenueTarget / 24;
    
    // Calculate increments for 5-second updates (12 per minute)
    const adsIncrementBase = adsHourlyIncrement / (60 * 12);
    const revenueIncrementBase = revenueHourlyIncrement / (60 * 12);
    
    setAdsCount(prev => {
      // Only increment if we haven't reached the target
      if (prev >= dailyAdsTarget) return dailyAdsTarget;
      
      // Very small random variation (±5%) for natural but stable progression
      const randomFactor = 0.95 + (Math.random() * 0.1);
      const increment = Math.ceil(adsIncrementBase * randomFactor);
      return Math.min(prev + increment, dailyAdsTarget);
    });
    
    setRevenueCount(prev => {
      // Only increment if we haven't reached the target
      if (prev >= dailyRevenueTarget) return dailyRevenueTarget;
      
      // Very small random variation (±5%) for natural but stable progression
      const randomFactor = 0.95 + (Math.random() * 0.1);
      const increment = Math.ceil(revenueIncrementBase * randomFactor);
      return Math.min(prev + increment, dailyRevenueTarget);
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
