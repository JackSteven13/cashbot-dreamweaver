
import { useState, useCallback, useEffect } from 'react';
import { loadStoredValues, saveValues } from './utils/storageManager';
import { calculateInitialValues } from './utils/valueCalculator';

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
  const [lastResetDate, setLastResetDate] = useState<string>(() => {
    return localStorage.getItem('stats_last_reset_date') || new Date().toDateString();
  });
  
  // Function to initialize counters
  const initializeCounters = useCallback(() => {
    // First check if we have stored values
    const storedValues = loadStoredValues();
    const today = new Date().toDateString();
    
    // Update the last reset date
    if (lastResetDate !== today) {
      localStorage.setItem('stats_last_reset_date', today);
      setLastResetDate(today);
    }
    
    if (storedValues.hasStoredValues) {
      // Only use stored values if they're from today
      const storedDate = localStorage.getItem('stats_storage_date');
      
      if (storedDate === today) {
        console.log("Using stored values from today:", storedValues);
        setAdsCount(storedValues.adsCount);
        setRevenueCount(storedValues.revenueCount);
        setDisplayedAdsCount(storedValues.adsCount);
        setDisplayedRevenueCount(storedValues.revenueCount);
        return;
      } else {
        console.log("Stored values are from a different day, calculating new values");
      }
    }
    
    // If no valid stored values, calculate new values and store current date
    const { initialAds, initialRevenue } = calculateInitialValues(dailyAdsTarget, dailyRevenueTarget);
    
    // Set initial values
    setAdsCount(initialAds);
    setRevenueCount(initialRevenue);
    setDisplayedAdsCount(initialAds);
    setDisplayedRevenueCount(initialRevenue);
    
    // Save initial values with today's date
    saveValues(initialAds, initialRevenue);
    localStorage.setItem('stats_storage_date', today);
    
    console.log(`Initialized counters: Ads=${initialAds}, Revenue=${initialRevenue}`);
  }, [dailyAdsTarget, dailyRevenueTarget, lastResetDate]);
  
  // Synchronize with global values periodically
  useEffect(() => {
    const syncWithGlobalValues = () => {
      const storedValues = loadStoredValues();
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem('stats_storage_date');
      
      // Only sync if the values are from today
      if (storedValues.hasStoredValues && storedDate === today) {
        // Only update if global values are larger to prevent decreases
        if (storedValues.adsCount > adsCount) setAdsCount(storedValues.adsCount);
        if (storedValues.revenueCount > revenueCount) setRevenueCount(storedValues.revenueCount);
      }
    };
    
    // Synchronize every 15 seconds
    const syncInterval = setInterval(syncWithGlobalValues, 15000);
    return () => clearInterval(syncInterval);
  }, [adsCount, revenueCount]);
  
  // Effect to update local storage when counters change
  useEffect(() => {
    if (adsCount > 0 && revenueCount > 0) {
      saveValues(adsCount, revenueCount);
      localStorage.setItem('stats_storage_date', new Date().toDateString());
    }
  }, [adsCount, revenueCount]);
  
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
