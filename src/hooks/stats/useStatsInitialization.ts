
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
  const [initialized, setInitialized] = useState(false);
  
  // Function to initialize counters
  const initializeCounters = useCallback(() => {
    // Prevent multiple initializations
    if (initialized) return;
    
    // First check if we have stored values
    const storedValues = loadStoredValues();
    const today = new Date().toDateString();
    
    // Update the last reset date
    if (lastResetDate !== today) {
      localStorage.setItem('stats_last_reset_date', today);
      setLastResetDate(today);
    }
    
    if (storedValues.hasStoredValues) {
      // Always use stored values to prevent flickering
      console.log("Using stored values:", storedValues);
      setAdsCount(storedValues.adsCount);
      setRevenueCount(storedValues.revenueCount);
      setDisplayedAdsCount(storedValues.adsCount);
      setDisplayedRevenueCount(storedValues.revenueCount);
      setInitialized(true);
      return;
    }
    
    // If no valid stored values, calculate new values and store current date
    const { initialAds, initialRevenue } = calculateInitialValues(dailyAdsTarget, dailyRevenueTarget);
    
    // Set initial values with protection to never use low values
    const safeAds = Math.max(40000, initialAds);
    const safeRevenue = Math.max(50000, initialRevenue);
    
    // Set initial values
    setAdsCount(safeAds);
    setRevenueCount(safeRevenue);
    setDisplayedAdsCount(safeAds);
    setDisplayedRevenueCount(safeRevenue);
    setInitialized(true);
    
    // Save initial values with today's date
    saveValues(safeAds, safeRevenue);
    localStorage.setItem('stats_storage_date', today);
    
    console.log(`Initialized counters: Ads=${safeAds}, Revenue=${safeRevenue}`);
  }, [dailyAdsTarget, dailyRevenueTarget, lastResetDate, initialized]);
  
  // Ensure initialization happens once
  useEffect(() => {
    if (!initialized) {
      initializeCounters();
    }
  }, [initialized, initializeCounters]);
  
  // Synchronize with global values periodically
  useEffect(() => {
    const syncWithGlobalValues = () => {
      if (!initialized) return;
      
      const storedValues = loadStoredValues();
      
      // Only sync if the values are valid
      if (storedValues.hasStoredValues) {
        // Only update if global values are larger to prevent decreases
        if (storedValues.adsCount > adsCount) {
          setAdsCount(storedValues.adsCount);
          setDisplayedAdsCount(storedValues.adsCount);
        }
        
        if (storedValues.revenueCount > revenueCount) {
          setRevenueCount(storedValues.revenueCount);
          setDisplayedRevenueCount(storedValues.revenueCount);
        }
      }
    };
    
    // Synchronize every 10 seconds
    const syncInterval = setInterval(syncWithGlobalValues, 10000);
    return () => clearInterval(syncInterval);
  }, [adsCount, revenueCount, initialized]);
  
  // Effect to update local storage when counters change
  useEffect(() => {
    if (initialized && adsCount > 0 && revenueCount > 0) {
      // Save values but ensure we never go below our minimum thresholds
      saveValues(
        Math.max(40000, adsCount),
        Math.max(50000, revenueCount)
      );
      localStorage.setItem('stats_storage_date', new Date().toDateString());
    }
  }, [adsCount, revenueCount, initialized]);
  
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
