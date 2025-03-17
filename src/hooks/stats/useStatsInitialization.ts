
import { useState, useCallback } from 'react';
import { getParisTime } from '@/utils/timeUtils';

interface UseStatsInitializationParams {
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

interface StatsInitializationResult {
  adsCount: number;
  revenueCount: number;
  displayedAdsCount: number;
  displayedRevenueCount: number;
  setAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  initializeCounters: () => void;
}

export const useStatsInitialization = ({
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsInitializationParams): StatsInitializationResult => {
  // Real counters tracking actual values
  const [adsCount, setAdsCount] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);
  
  // Displayed counters that will animate to the real values
  const [displayedAdsCount, setDisplayedAdsCount] = useState(0);
  const [displayedRevenueCount, setDisplayedRevenueCount] = useState(0);
  
  // Calculate bi-weekly progress
  const getBiWeeklyProgress = useCallback(() => {
    const parisTime = getParisTime();
    const currentDay = parisTime.getDate();
    
    // Determine which 14-day period we're in
    let periodStartDay;
    if (currentDay < 15) {
      periodStartDay = 1;
    } else if (currentDay < 29) {
      periodStartDay = 15;
    } else {
      const lastDayOfMonth = new Date(parisTime.getFullYear(), parisTime.getMonth() + 1, 0).getDate();
      periodStartDay = 29;
      
      // If this is a short month and we don't have a day 29, use different logic
      if (periodStartDay > lastDayOfMonth) {
        // Adjust for months with less than 29 days
        const daysPassed = currentDay;
        const totalDaysInMonth = lastDayOfMonth;
        return daysPassed / totalDaysInMonth;
      }
    }
    
    // Calculate days passed in this period and seconds in the current day
    const daysPassed = currentDay - periodStartDay;
    const hours = parisTime.getHours();
    const minutes = parisTime.getMinutes();
    const seconds = parisTime.getSeconds();
    
    // Calculate total seconds elapsed in the 14-day period
    const secondsInDay = hours * 3600 + minutes * 60 + seconds;
    const totalElapsedSeconds = daysPassed * 86400 + secondsInDay;
    
    // Total seconds in a 14-day period
    const totalSecondsIn14Days = 14 * 86400;
    
    return Math.min(totalElapsedSeconds / totalSecondsIn14Days, 1);
  }, []);
  
  // Initialize counters
  const initializeCounters = useCallback(() => {
    const periodProgress = getBiWeeklyProgress();
    const currentAdsCount = Math.floor(periodProgress * dailyAdsTarget);
    const currentRevenueCount = Math.floor(periodProgress * dailyRevenueTarget);
    
    setAdsCount(currentAdsCount);
    setRevenueCount(currentRevenueCount);
    
    // Initialize displayed counters to match real counters (no animation drop)
    setDisplayedAdsCount(currentAdsCount);
    setDisplayedRevenueCount(currentRevenueCount);
  }, [getBiWeeklyProgress, dailyAdsTarget, dailyRevenueTarget]);

  return {
    adsCount,
    revenueCount,
    displayedAdsCount,
    displayedRevenueCount,
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount,
    initializeCounters
  };
};
