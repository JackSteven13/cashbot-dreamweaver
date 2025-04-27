
import { useEffect, useRef } from 'react';
import { incrementDateLinkedStats } from './utils/storageManager';

interface StatsAutoUpdateProps {
  adsCount: number;
  revenueCount: number;
  setAdsCount: (value: number) => void;
  setRevenueCount: (value: number) => void;
  animateCounters: (ads: number, revenue: number) => void;
}

export const useStatsAutoUpdate = ({
  adsCount,
  revenueCount,
  setAdsCount,
  setRevenueCount,
  animateCounters
}: StatsAutoUpdateProps) => {
  const countersInitializedRef = useRef(false);
  const lastUpdateTimeRef = useRef(Date.now());

  useEffect(() => {
    // Prevent running multiple update cycles
    if (countersInitializedRef.current) return;
    countersInitializedRef.current = true;
    
    const initialTimeout = setTimeout(() => {
      const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
      
      setAdsCount(newAdsCount);
      setRevenueCount(newRevenueCount);
      animateCounters(newAdsCount, newRevenueCount);
      lastUpdateTimeRef.current = Date.now();
    }, 30000);
    
    const incrementInterval = setInterval(() => {
      const now = Date.now();
      
      // Only update after significant time has passed (5 minutes)
      if (now - lastUpdateTimeRef.current > 300000 && Math.random() > 0.4) {
        const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
        
        setAdsCount(newAdsCount);
        setRevenueCount(newRevenueCount);
        animateCounters(newAdsCount, newRevenueCount);
        
        lastUpdateTimeRef.current = now;
        
        try {
          localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
          localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
        } catch (e) {
          console.error("Failed to save displayed counts:", e);
        }
      }
    }, 300000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(incrementInterval);
    };
  }, []); // Empty dependency array since we use refs to track changes
};
