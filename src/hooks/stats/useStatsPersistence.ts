
import { useState, useEffect, useRef } from 'react';
import { 
  ensureProgressiveValues, 
  getDateConsistentStats, 
  saveValues 
} from './utils/storageManager';

export const useStatsPersistence = (
  MINIMUM_ADS_COUNT: number,
  MINIMUM_REVENUE_COUNT: number
) => {
  const isFirstLoadRef = useRef(true);
  const [adsCount, setAdsCount] = useState(() => {
    ensureProgressiveValues();
    const consistentStats = getDateConsistentStats();
    return Math.max(consistentStats.adsCount, MINIMUM_ADS_COUNT);
  });

  const [revenueCount, setRevenueCount] = useState(() => {
    ensureProgressiveValues();
    const consistentStats = getDateConsistentStats();
    return Math.max(consistentStats.revenueCount, MINIMUM_REVENUE_COUNT);
  });

  // Save values on unmount - with dependency array to avoid infinite loops
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveValues(adsCount, revenueCount, false);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [adsCount, revenueCount]);

  return {
    adsCount,
    revenueCount,
    setAdsCount,
    setRevenueCount
  };
};
