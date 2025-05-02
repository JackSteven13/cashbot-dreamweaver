
import { useEffect, RefObject } from 'react';
import { incrementDateLinkedStats } from '../utils/storageManager';
import { StableValuesRef } from '../types';

interface UsePeriodicIncrementParams {
  stableValuesRef: RefObject<StableValuesRef>;
  setAdsCount: (count: number) => void;
  setRevenueCount: (count: number) => void;
  setDisplayedAdsCount: (count: number) => void;
  setDisplayedRevenueCount: (count: number) => void;
  animateCounters: (adsCount: number, revenueCount: number) => void;
}

/**
 * Hook to handle periodic incrementation of counters
 */
export const usePeriodicIncrement = ({
  stableValuesRef,
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  animateCounters
}: UsePeriodicIncrementParams) => {
  useEffect(() => {
    // First increment after longer delay
    const initialTimeout = setTimeout(() => {
      const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
      
      setAdsCount(newAdsCount);
      setRevenueCount(newRevenueCount);
      setDisplayedAdsCount(newAdsCount);
      setDisplayedRevenueCount(newRevenueCount);
      
      if (stableValuesRef.current) {
        stableValuesRef.current.lastAutoIncrementTime = Date.now();
      }
    }, 30000); // Wait 30 seconds before first update
    
    // Then increment less frequently (minimum 5 minutes)
    const incrementInterval = setInterval(() => {
      if (!stableValuesRef.current) return;
      
      const now = Date.now();
      
      // Strongly limit increment frequency
      if (now - stableValuesRef.current.lastAutoIncrementTime > 300000) { // 5 minutes minimum
        // Add probability for increment not happening every interval
        if (Math.random() > 0.4) { // 60% chance to increment
          stableValuesRef.current.lastAutoIncrementTime = now;
          
          const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
          
          setAdsCount(newAdsCount);
          setRevenueCount(newRevenueCount);
          
          // Smooth animation to new values
          animateCounters(newAdsCount, newRevenueCount);
          
          // Save for persistence
          localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
          localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
        }
      }
    }, 300000); // Check every 5 minutes
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(incrementInterval);
    };
  }, [
    animateCounters, 
    setAdsCount, 
    setRevenueCount, 
    setDisplayedAdsCount, 
    setDisplayedRevenueCount, 
    stableValuesRef
  ]);
};
