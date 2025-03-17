
import { useCallback } from 'react';

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
  // Get current Paris time
  const getNowInParis = useCallback(() => {
    const now = new Date();
    const parisOffset = now.getTimezoneOffset();
    const parisTime = new Date(now.getTime() - parisOffset * 60000);
    return parisTime;
  }, []);
  
  // Calculate time until next reset
  const getTimeUntilNextReset = useCallback(() => {
    const parisTime = getNowInParis();
    const currentDay = parisTime.getDate();
    const currentYear = parisTime.getFullYear();
    const currentMonth = parisTime.getMonth();
    
    let nextResetDate;
    
    if (currentDay < 15) {
      // Next reset is on the 15th
      nextResetDate = new Date(currentYear, currentMonth, 15);
    } else if (currentDay < 29) {
      // Next reset is on the 29th, but check if month has 29th
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      nextResetDate = new Date(currentYear, currentMonth, Math.min(29, lastDayOfMonth));
    } else {
      // Next reset is on the 1st of next month
      nextResetDate = new Date(currentYear, currentMonth + 1, 1);
    }
    
    // Set to midnight
    nextResetDate.setHours(0, 0, 0, 0);
    
    // If we're already past midnight, add a day
    if (parisTime.getHours() === 0 && parisTime.getMinutes() === 0 && 
        parisTime.getDate() === nextResetDate.getDate()) {
      nextResetDate.setDate(nextResetDate.getDate() + 1);
    }
    
    return nextResetDate.getTime() - parisTime.getTime();
  }, [getNowInParis]);
  
  // Schedule next cycle update
  const scheduleCycleUpdate = useCallback(() => {
    const timeUntilNextReset = getTimeUntilNextReset();
    
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
  }, [getTimeUntilNextReset, setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
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
