
import { useEffect, useRef } from 'react';
import { incrementDateLinkedStats } from './utils/statsIncrementer';

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
  const isRunningRef = useRef(false);

  useEffect(() => {
    // Prevent running multiple update cycles and re-renders
    if (countersInitializedRef.current || isRunningRef.current) return;
    
    countersInitializedRef.current = true;
    
    const initialTimeout = setTimeout(() => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;
      
      try {
        const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
        
        setAdsCount(newAdsCount);
        setRevenueCount(newRevenueCount);
        animateCounters(newAdsCount, newRevenueCount);
        lastUpdateTimeRef.current = Date.now();
      } finally {
        isRunningRef.current = false;
      }
    }, 30000);
    
    const incrementInterval = setInterval(() => {
      if (isRunningRef.current) return;
      
      const now = Date.now();
      
      // Only update after significant time has passed (5 minutes)
      if (now - lastUpdateTimeRef.current > 300000 && Math.random() > 0.4) {
        isRunningRef.current = true;
        
        try {
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
        } finally {
          isRunningRef.current = false;
        }
      }
    }, 300000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(incrementInterval);
    };
  }, []); // Empty dependency array since we use refs to track changes
};
