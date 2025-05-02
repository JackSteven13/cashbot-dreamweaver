
import { useEffect } from 'react';
import { 
  ensureProgressiveValues, 
  getDateConsistentStats, 
  saveValues 
} from '../utils/storageManager';

interface UseVisibilitySyncParams {
  setAdsCount: (count: number) => void;
  setRevenueCount: (count: number) => void;
  setDisplayedAdsCount: (count: number) => void;
  setDisplayedRevenueCount: (count: number) => void;
}

/**
 * Hook to synchronize stats when page visibility changes
 */
export const useVisibilitySync = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount
}: UseVisibilitySyncParams) => {
  useEffect(() => {
    // Ensure progressive values on mount
    ensureProgressiveValues();
    
    // Get synchronized values
    const consistentStats = getDateConsistentStats();
    
    // Initialize with consistent values
    setAdsCount(consistentStats.adsCount);
    setRevenueCount(consistentStats.revenueCount);
    setDisplayedAdsCount(consistentStats.adsCount);
    setDisplayedRevenueCount(consistentStats.revenueCount);
    
    // Persist values to guarantee they never decrease
    saveValues(consistentStats.adsCount, consistentStats.revenueCount, false);
    
    console.log('Stats initialized with consistent and progressive values:', consistentStats);
    
    // Add visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When page becomes visible, ensure values are well synchronized
        ensureProgressiveValues();
        const refreshedStats = getDateConsistentStats();
        
        setAdsCount(refreshedStats.adsCount);
        setRevenueCount(refreshedStats.revenueCount);
        setDisplayedAdsCount(refreshedStats.adsCount);
        setDisplayedRevenueCount(refreshedStats.revenueCount);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
};
