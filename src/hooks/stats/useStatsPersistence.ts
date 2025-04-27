
import { useState, useEffect, useRef, useCallback } from 'react';
import { loadStoredValues, saveValues } from './utils/storageOperations';
import { ensureProgressiveValues, getDateConsistentStats } from './utils/valueSynchronizer';

export const useStatsPersistence = (
  MINIMUM_ADS_COUNT: number,
  MINIMUM_REVENUE_COUNT: number
) => {
  // Use ref to prevent unnecessary re-renders and track values
  const valuesRef = useRef({
    adsCount: MINIMUM_ADS_COUNT,
    revenueCount: MINIMUM_REVENUE_COUNT
  });
  
  const isFirstLoadRef = useRef(true);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSavedInitial = useRef(false);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const isMountedRef = useRef(true);
  
  // Initialize state with consistent values - reduce calls to localStorage
  const [adsCount, setAdsCount] = useState(() => {
    if (isFirstLoadRef.current) {
      try {
        ensureProgressiveValues();
        const consistentStats = getDateConsistentStats();
        const initialAdsCount = Math.max(consistentStats.adsCount, MINIMUM_ADS_COUNT);
        valuesRef.current.adsCount = initialAdsCount;
        return initialAdsCount;
      } catch (e) {
        console.error("Error initializing ads count:", e);
        return MINIMUM_ADS_COUNT;
      }
    }
    return valuesRef.current.adsCount;
  });

  const [revenueCount, setRevenueCount] = useState(() => {
    if (isFirstLoadRef.current) {
      try {
        const consistentStats = getDateConsistentStats();
        const initialRevenueCount = Math.max(consistentStats.revenueCount, MINIMUM_REVENUE_COUNT);
        valuesRef.current.revenueCount = initialRevenueCount;
        isFirstLoadRef.current = false;
        hasSavedInitial.current = true;
        return initialRevenueCount;
      } catch (e) {
        console.error("Error initializing revenue count:", e);
        return MINIMUM_REVENUE_COUNT;
      }
    }
    return valuesRef.current.revenueCount;
  });

  // Set component mount/unmount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoize the setters to avoid recreating them on each render
  const setAdsCountSafe = useCallback((value: number) => {
    valuesRef.current.adsCount = value;
    if (isMountedRef.current) {
      setAdsCount(value);
    }
  }, []);

  const setRevenueCountSafe = useCallback((value: number) => {
    valuesRef.current.revenueCount = value;
    if (isMountedRef.current) {
      setRevenueCount(value);
    }
  }, []);

  // Save values with debouncing to limit localStorage writes
  useEffect(() => {
    // Skip frequent saves
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 10000) {
      return;
    }
    
    const handleBeforeUnload = () => {
      try {
        saveValues(valuesRef.current.adsCount, valuesRef.current.revenueCount, false);
      } catch (e) {
        console.error("Failed to save values on unload:", e);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Use a ref for the timer to properly clean up
    const currentTimer = saveTimerRef.current;
    
    // Only save if values changed recently and component is mounted
    if (isMountedRef.current) {
      // Debounce saves to avoid excessive localStorage operations
      if (currentTimer) {
        clearTimeout(currentTimer);
      }
      
      saveTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          try {
            saveValues(adsCount, revenueCount, false);
          } catch (e) {
            console.error("Failed to save stats values:", e);
          }
          saveTimerRef.current = null;
          lastUpdateTimeRef.current = Date.now();
        }
      }, 30000); // Increased debounce time to 30 seconds
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
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

export default useStatsPersistence;
