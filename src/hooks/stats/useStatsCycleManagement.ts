
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
    
    console.log(`Next counter reset scheduled in ${Math.floor(timeUntilNextReset / 1000 / 60)} minutes`);
    
    const resetTimeout = setTimeout(() => {
      // Reset counters
      setAdsCount(0);
      setRevenueCount(0);
      setDisplayedAdsCount(0);
      setDisplayedRevenueCount(0);
      
      // Schedule the next reset
      scheduleCycleUpdate();
    }, timeUntilNextReset);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Randomly increment counters
  const incrementCountersRandomly = useCallback(() => {
    // Simulate real-time activity with randomized increases
    setAdsCount(prev => {
      const randomIncrement = Math.floor(Math.random() * 10) + 3;
      const newValue = Math.min(prev + randomIncrement, dailyAdsTarget);
      return newValue;
    });
    
    setRevenueCount(prev => {
      const randomIncrement = Math.floor(Math.random() * 100) + 50;
      const newValue = Math.min(prev + randomIncrement, dailyRevenueTarget);
      return newValue;
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
