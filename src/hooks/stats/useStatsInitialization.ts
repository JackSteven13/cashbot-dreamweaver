
import { useState, useEffect, useCallback } from 'react';

interface UseStatsInitializationParams {
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

interface UseStatsInitializationResult {
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
}: UseStatsInitializationParams): UseStatsInitializationResult => {
  const [adsCount, setAdsCount] = useState<number>(0);
  const [revenueCount, setRevenueCount] = useState<number>(0);
  const [displayedAdsCount, setDisplayedAdsCount] = useState<number>(0);
  const [displayedRevenueCount, setDisplayedRevenueCount] = useState<number>(0);
  
  // Calculate current progress based on time of day
  const calculateInitialValues = useCallback(() => {
    // Get the current hour of the day (0-23)
    const currentHour = new Date().getHours();
    
    // Calculate what percentage of the day has passed
    // We'll be more active during working hours
    let dayPercentage = 0;
    
    if (currentHour < 7) {
      // Between midnight and 7am - slower progress (night time)
      dayPercentage = (currentHour / 24) * 0.5;
    } else if (currentHour >= 7 && currentHour < 23) {
      // Between 7am and 11pm - faster progress (day time)
      const adjustedHour = currentHour - 7; // 0 to 16 hours
      const workingDayPercent = adjustedHour / 16; // 0% to 100% of working day
      
      // Base percentage (what was achieved overnight) plus working day progress
      dayPercentage = 0.1 + (workingDayPercent * 0.8);
    } else {
      // Between 11pm and midnight - almost complete
      dayPercentage = 0.95;
    }
    
    // Add some random variation (±10%)
    const randomVariation = (Math.random() * 0.2) - 0.1;
    dayPercentage = Math.max(0, Math.min(0.95, dayPercentage + randomVariation));
    
    // Calculate the estimated counts based on the percentage
    const estimatedAds = Math.floor(dailyAdsTarget * dayPercentage);
    const estimatedRevenue = Math.floor(dailyRevenueTarget * dayPercentage);
    
    // Set the counts
    setAdsCount(estimatedAds);
    setRevenueCount(estimatedRevenue);
    
    // Initialize displayed values to match what we calculated
    setDisplayedAdsCount(Math.floor(estimatedAds * 0.9)); // Start slightly behind
    setDisplayedRevenueCount(Math.floor(estimatedRevenue * 0.85)); // Start slightly behind
  }, [dailyAdsTarget, dailyRevenueTarget]);
  
  // Function to initialize the counters
  const initializeCounters = useCallback(() => {
    calculateInitialValues();
  }, [calculateInitialValues]);
  
  // Initialize on mount
  useEffect(() => {
    initializeCounters();
  }, [initializeCounters]);
  
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

export default useStatsInitialization;
