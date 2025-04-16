
import { useState, useCallback, useEffect } from 'react';

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

// Keys for local storage
const STORAGE_KEYS = {
  GLOBAL_ADS_COUNT: 'global_ads_count',
  GLOBAL_REVENUE_COUNT: 'global_revenue_count',
  ADS_COUNT: 'stats_ads_count',
  REVENUE_COUNT: 'stats_revenue_count',
  LAST_UPDATE: 'stats_last_update',
  RESET_DATE: 'stats_reset_date'
};

export const useStatsInitialization = ({
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsInitializationParams): UseStatsInitializationResult => {
  const [adsCount, setAdsCount] = useState<number>(0);
  const [revenueCount, setRevenueCount] = useState<number>(0);
  const [displayedAdsCount, setDisplayedAdsCount] = useState<number>(0);
  const [displayedRevenueCount, setDisplayedRevenueCount] = useState<number>(0);
  
  // Function to retrieve stored values from localStorage
  const loadStoredValues = useCallback(() => {
    try {
      // First try to load global values (shared between all users)
      const globalAdsCount = localStorage.getItem(STORAGE_KEYS.GLOBAL_ADS_COUNT);
      const globalRevenueCount = localStorage.getItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT);
      
      // If we have global values, use them as priority
      if (globalAdsCount && globalRevenueCount) {
        const parsedAdsCount = parseInt(globalAdsCount, 10);
        const parsedRevenueCount = parseInt(globalRevenueCount, 10);
        
        if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && parsedAdsCount >= 0 && parsedRevenueCount >= 0) {
          console.log(`Loaded global stored values: Ads=${parsedAdsCount}, Revenue=${parsedRevenueCount}`);
          return {
            hasStoredValues: true,
            adsCount: parsedAdsCount,
            revenueCount: parsedRevenueCount,
            lastUpdate: Date.now()
          };
        }
      }
      
      // Fallback to user-specific values if no global values
      const storedAdsCount = localStorage.getItem(STORAGE_KEYS.ADS_COUNT);
      const storedRevenueCount = localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT);
      const storedLastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
      const storedResetDate = localStorage.getItem(STORAGE_KEYS.RESET_DATE);
      
      const today = new Date().toDateString();
      
      // Check if we've already done a reset today
      if (storedResetDate !== today) {
        // If the last reset wasn't today, we can proceed normally
        // But don't reset, use stored values if available
      }
      
      if (storedAdsCount && storedRevenueCount) {
        const parsedAdsCount = parseInt(storedAdsCount, 10);
        const parsedRevenueCount = parseInt(storedRevenueCount, 10);
        
        if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && parsedAdsCount >= 0 && parsedRevenueCount >= 0) {
          console.log(`Loaded stored values: Ads=${parsedAdsCount}, Revenue=${parsedRevenueCount}`);
          return {
            hasStoredValues: true,
            adsCount: parsedAdsCount,
            revenueCount: parsedRevenueCount,
            lastUpdate: storedLastUpdate ? parseInt(storedLastUpdate, 10) : Date.now()
          };
        }
      }
      return { hasStoredValues: false };
    } catch (e) {
      console.error("Error loading stored values:", e);
      return { hasStoredValues: false };
    }
  }, []);
  
  // Function to save values to localStorage
  const saveValues = useCallback((ads: number, revenue: number) => {
    try {
      // Ensure positive values before saving
      const safeAdsCount = Math.max(0, Math.round(ads));
      const safeRevenueCount = Math.max(0, Math.round(revenue));
      
      // Save both as global and user-specific values
      localStorage.setItem(STORAGE_KEYS.GLOBAL_ADS_COUNT, safeAdsCount.toString());
      localStorage.setItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT, safeRevenueCount.toString());
      
      localStorage.setItem(STORAGE_KEYS.ADS_COUNT, safeAdsCount.toString());
      localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, safeRevenueCount.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.RESET_DATE, new Date().toDateString());
      
      // Also save as displayed counts for immediate consistency
      localStorage.setItem('displayed_ads_count', safeAdsCount.toString());
      localStorage.setItem('displayed_revenue_count', safeRevenueCount.toString());
    } catch (e) {
      console.error("Error saving values to localStorage:", e);
    }
  }, []);
  
  // Calculate current progression based on time of day
  const calculateInitialValues = useCallback(() => {
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
    // Get current hour (0-23)
    const currentHour = new Date().getHours();
    
    // Instead of a value that resets to 0 at midnight,
    // we start with substantial values to give the impression
    // that the system has been running for a while
    
    // Guaranteed minimum initial value (between 150 and 300 for ads)
    const minBaseAds = 150 + Math.floor(Math.random() * 150);
    // Guaranteed minimum initial value (between 200 and 400 for revenue)
    const minBaseRevenue = 200 + Math.floor(Math.random() * 200);
    
    // Initial base (between 18% and 25% of daily target)
    const basePercentage = 0.18 + (Math.random() * 0.07);
    
    // Add progression based on hour (up to 35% additional)
    let hourlyProgressPercent = 0;
    
    if (currentHour >= 8 && currentHour <= 23) {
      // During the day (8h-23h), faster progression
      hourlyProgressPercent = (currentHour - 8) / 15 * 0.35;
    } else if (currentHour >= 0 && currentHour < 8) {
      // During the night (0h-8h), slower progression
      hourlyProgressPercent = ((currentHour + 24 - 8) % 24) / 24 * 0.15;
    }
    
    // Total percentage (between 18% and 60% depending on time)
    const totalPercentage = basePercentage + hourlyProgressPercent;
    
    // Random variation for realistic values (±2%)
    const finalPercentage = Math.min(0.60, totalPercentage + (Math.random() * 0.04 - 0.02));
    
    // Calculate initial values based on percentage, but with a guaranteed minimum
    const calculatedAds = Math.floor(dailyAdsTarget * finalPercentage);
    const calculatedRevenue = Math.floor(dailyRevenueTarget * finalPercentage);
    
    // Use the larger of the two values: calculated or guaranteed minimum
    const initialAds = Math.max(minBaseAds, calculatedAds);
    
    // Revenue is not exactly proportional to ads (slight variation)
    const revenueVariance = 0.97 + (Math.random() * 0.06); // 97% to 103%
    const calculatedRevenueWithVariance = Math.floor(calculatedRevenue * revenueVariance);
    const initialRevenue = Math.max(minBaseRevenue, calculatedRevenueWithVariance);
    
    // Set initial values (internal and displayed counters identical at startup)
    setAdsCount(initialAds);
    setRevenueCount(initialRevenue);
    setDisplayedAdsCount(initialAds);
    setDisplayedRevenueCount(initialRevenue);
    
    // Save initial values
    saveValues(initialAds, initialRevenue);
    
    console.log(`Initialized counters: Ads=${initialAds}, Revenue=${initialRevenue}`);
  }, [dailyAdsTarget, dailyRevenueTarget, loadStoredValues, saveValues]);
  
  // Function to initialize counters
  const initializeCounters = useCallback(() => {
    calculateInitialValues();
  }, [calculateInitialValues]);
  
  // Synchronize with global values periodically
  useEffect(() => {
    const syncWithGlobalValues = () => {
      const globalAdsCount = localStorage.getItem(STORAGE_KEYS.GLOBAL_ADS_COUNT);
      const globalRevenueCount = localStorage.getItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT);
      
      if (globalAdsCount && globalRevenueCount) {
        const parsedAds = parseInt(globalAdsCount, 10);
        const parsedRevenue = parseInt(globalRevenueCount, 10);
        
        if (!isNaN(parsedAds) && !isNaN(parsedRevenue) && parsedAds > 0 && parsedRevenue > 0) {
          // Only update if global values are larger
          if (parsedAds > adsCount) setAdsCount(parsedAds);
          if (parsedRevenue > revenueCount) setRevenueCount(parsedRevenue);
        }
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
  }, [adsCount, revenueCount, saveValues]);
  
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
