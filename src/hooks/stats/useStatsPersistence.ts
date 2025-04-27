
import { useState, useEffect, useRef } from 'react';
import { 
  loadStoredValues, 
  saveValues,
  ensureProgressiveValues, 
  getDateConsistentStats
} from './utils/storageManager';

export const useStatsPersistence = (
  MINIMUM_ADS_COUNT: number,
  MINIMUM_REVENUE_COUNT: number
) => {
  // Use ref to prevent unnecessary re-renders
  const valuesRef = useRef({
    adsCount: MINIMUM_ADS_COUNT,
    revenueCount: MINIMUM_REVENUE_COUNT
  });
  
  const isFirstLoadRef = useRef(true);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize state with consistent values
  const [adsCount, setAdsCount] = useState(() => {
    // Only compute this once during initialization
    if (isFirstLoadRef.current) {
      ensureProgressiveValues();
      const consistentStats = getDateConsistentStats();
      const initialAdsCount = Math.max(consistentStats.adsCount, MINIMUM_ADS_COUNT);
      valuesRef.current.adsCount = initialAdsCount;
      return initialAdsCount;
    }
    return valuesRef.current.adsCount;
  });

  const [revenueCount, setRevenueCount] = useState(() => {
    // Only compute this once during initialization
    if (isFirstLoadRef.current) {
      ensureProgressiveValues();
      const consistentStats = getDateConsistentStats();
      const initialRevenueCount = Math.max(consistentStats.revenueCount, MINIMUM_REVENUE_COUNT);
      valuesRef.current.revenueCount = initialRevenueCount;
      isFirstLoadRef.current = false;
      return initialRevenueCount;
    }
    return valuesRef.current.revenueCount;
  });

  // Custom setters to update the ref and state
  const setAdsCountSafe = (value: number) => {
    valuesRef.current.adsCount = value;
    setAdsCount(value);
  };

  const setRevenueCountSafe = (value: number) => {
    valuesRef.current.revenueCount = value;
    setRevenueCount(value);
  };

  // Save values on unmount - with controlled updates to avoid loops
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveValues(valuesRef.current.adsCount, valuesRef.current.revenueCount, false);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Throttled saving while running
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      saveValues(adsCount, revenueCount, false);
      saveTimerRef.current = null;
    }, 2000);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [adsCount, revenueCount]);

  return {
    adsCount,
    revenueCount,
    setAdsCount: setAdsCountSafe,
    setRevenueCount: setRevenueCountSafe
  };
};
