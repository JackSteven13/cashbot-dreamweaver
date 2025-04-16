
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
  
  // Function to initialize counters
  const initializeCounters = useCallback(() => {
    // First check if we have stored values
    const storedValues = loadStoredValues();
    
    if (storedValues.hasStoredValues) {
      // Use stored values
      setAdsCount(storedValues.adsCount);
      setRevenueCount(storedValues.revenueCount);
      setDisplayedAdsCount(storedValues.adsCount);
      setDisplayedRevenueCount(storedValues.revenueCount);
      return;
    }
    
    // If no stored values, calculate new values
    const { initialAds, initialRevenue } = calculateInitialValues(dailyAdsTarget, dailyRevenueTarget);
    
    // Set initial values
    setAdsCount(initialAds);
    setRevenueCount(initialRevenue);
    setDisplayedAdsCount(initialAds);
    setDisplayedRevenueCount(initialRevenue);
    
    // Save initial values
    saveValues(initialAds, initialRevenue);
    
    console.log(`Initialized counters: Ads=${initialAds}, Revenue=${initialRevenue}`);
  }, [dailyAdsTarget, dailyRevenueTarget]);
  
  // Synchronize with global values periodically
  useEffect(() => {
    const syncWithGlobalValues = () => {
      const storedValues = loadStoredValues();
      if (storedValues.hasStoredValues) {
        // Only update if global values are larger
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
