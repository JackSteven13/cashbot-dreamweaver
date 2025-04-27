
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Stable refs for props to avoid re-renders
  const propsRef = useRef({
    adsCount,
    revenueCount,
    setAdsCount,
    setRevenueCount,
    animateCounters
  });
  
  // Update refs when props change without triggering effects
  useEffect(() => {
    propsRef.current = {
      adsCount,
      revenueCount,
      setAdsCount,
      setRevenueCount,
      animateCounters
    };
  });

  useEffect(() => {
    // Prevent running multiple update cycles and re-renders
    if (countersInitializedRef.current || isRunningRef.current) return;
    
    countersInitializedRef.current = true;
    
    // Clean up any existing timers first
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    timerRef.current = setTimeout(() => {
      // Use refs for consistency check to avoid triggering re-renders
      if (isRunningRef.current) return;
      isRunningRef.current = true;
      
      try {
        const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
        
        propsRef.current.setAdsCount(newAdsCount);
        propsRef.current.setRevenueCount(newRevenueCount);
        propsRef.current.animateCounters(newAdsCount, newRevenueCount);
        lastUpdateTimeRef.current = Date.now();
      } finally {
        isRunningRef.current = false;
      }
    }, 30000);
    
    intervalRef.current = setInterval(() => {
      if (isRunningRef.current) return;
      
      const now = Date.now();
      
      // Only update after significant time has passed (5 minutes)
      if (now - lastUpdateTimeRef.current > 300000 && Math.random() > 0.4) {
        isRunningRef.current = true;
        
        try {
          const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
          
          propsRef.current.setAdsCount(newAdsCount);
          propsRef.current.setRevenueCount(newRevenueCount);
          propsRef.current.animateCounters(newAdsCount, newRevenueCount);
          
          lastUpdateTimeRef.current = now;
          
          try {
            // Ensure we don't trigger a re-render from localStorage changes
            if (document.visibilityState === 'visible') {
              localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
              localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
            }
          } catch (e) {
            console.error("Failed to save displayed counts:", e);
          }
        } finally {
          isRunningRef.current = false;
        }
      }
    }, 300000);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependency array as we use refs for all updates
};
