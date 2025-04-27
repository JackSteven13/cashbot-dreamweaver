
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
  // Refs to manage state without causing re-renders
  const countersInitializedRef = useRef(false);
  const lastUpdateTimeRef = useRef(Date.now());
  const isRunningRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
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

  // Set component mounted status
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => { 
      isMountedRef.current = false;
      
      // Clear timers on unmount
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // The main effect that sets up the auto-update functionality
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
    
    // First update after some delay
    timerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      // Use refs for consistency check to avoid triggering re-renders
      if (isRunningRef.current) return;
      isRunningRef.current = true;
      
      try {
        const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
        
        if (isMountedRef.current) {
          propsRef.current.setAdsCount(newAdsCount);
          propsRef.current.setRevenueCount(newRevenueCount);
          propsRef.current.animateCounters(newAdsCount, newRevenueCount);
          lastUpdateTimeRef.current = Date.now();
        }
      } catch (error) {
        console.error("Error in useStatsAutoUpdate initial timer:", error);
      } finally {
        isRunningRef.current = false;
      }
    }, 45000); // Longer initial delay
    
    // Periodic updates with reduced frequency
    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      if (isRunningRef.current) return;
      
      const now = Date.now();
      
      // Only update after significant time has passed (at least 5 minutes)
      if (now - lastUpdateTimeRef.current > 300000 && Math.random() > 0.5) {
        isRunningRef.current = true;
        
        try {
          const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
          
          if (isMountedRef.current) {
            propsRef.current.setAdsCount(newAdsCount);
            propsRef.current.setRevenueCount(newRevenueCount);
            propsRef.current.animateCounters(newAdsCount, newRevenueCount);
            
            lastUpdateTimeRef.current = now;
            
            try {
              // Ensure we don't trigger a re-render from localStorage changes
              // Only update localStorage if the tab is visible to reduce unnecessary operations
              if (document.visibilityState === 'visible') {
                localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
                localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
              }
            } catch (e) {
              console.error("Failed to save displayed counts:", e);
            }
          }
        } catch (error) {
          console.error("Error in useStatsAutoUpdate interval:", error);
        } finally {
          isRunningRef.current = false;
        }
      }
    }, 600000); // Reduced frequency (10 minutes)
    
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

export default useStatsAutoUpdate;
