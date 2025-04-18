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
  
  const initializeCounters = useCallback(() => {
    if (initialized) return;
    
    const storedValues = loadStoredValues();
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
      localStorage.setItem('stats_last_reset_date', today);
      setLastResetDate(today);
    }
    
    if (storedValues.hasStoredValues) {
      console.log("Using stored values:", storedValues);
      setAdsCount(storedValues.adsCount);
      setRevenueCount(storedValues.revenueCount);
      setDisplayedAdsCount(storedValues.adsCount);
      setDisplayedRevenueCount(storedValues.revenueCount);
      setInitialized(true);
      return;
    }
    
    const { initialAds, initialRevenue } = calculateInitialValues(dailyAdsTarget, dailyRevenueTarget);
    
    const safeAds = Math.max(40000, initialAds);
    const safeRevenue = Math.max(50000, initialRevenue);
    
    setAdsCount(safeAds);
    setRevenueCount(safeRevenue);
    setDisplayedAdsCount(safeAds);
    setDisplayedRevenueCount(safeRevenue);
    setInitialized(true);
    
    saveValues(safeAds, safeRevenue);
    localStorage.setItem('stats_storage_date', today);
    
    console.log(`Initialized counters: Ads=${safeAds}, Revenue=${safeRevenue}`);
  }, [dailyAdsTarget, dailyRevenueTarget, lastResetDate, initialized]);
  
  useEffect(() => {
    if (!initialized) {
      initializeCounters();
    }
  }, [initialized, initializeCounters]);
  
  useEffect(() => {
    const syncWithGlobalValues = () => {
      if (!initialized) return;
      
      const storedValues = loadStoredValues();
      
      if (storedValues.hasStoredValues) {
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
    
    const syncInterval = setInterval(syncWithGlobalValues, 10000);
    return () => clearInterval(syncInterval);
  }, [adsCount, revenueCount, initialized]);
  
  useEffect(() => {
    if (initialized && adsCount > 0 && revenueCount > 0) {
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
