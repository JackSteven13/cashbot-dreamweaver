
import { useState, useEffect, useRef, useMemo } from 'react';
import { MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT } from './utils/valueInitializer';
import { getDateConsistentStats, ensureProgressiveValues } from './utils/valueSynchronizer';

interface UsePersistentStatsParams {
  autoIncrement?: boolean;
  userId?: string;
  forceGrowth?: boolean;
  correlationRatio?: number;
}

interface StatsValues {
  adsCount: number;
  revenueCount: number;
}

// Cache to prevent recalculating for the same parameters
const statsCache: Record<string, {
  values: StatsValues,
  timestamp: number
}> = {};

export const usePersistentStats = ({
  autoIncrement = true,
  userId = 'global',
  forceGrowth = false,
  correlationRatio = 0.76203
}: UsePersistentStatsParams = {}): StatsValues => {
  // Create a stable cache key
  const cacheKey = useMemo(() => 
    `${userId}:${autoIncrement ? '1' : '0'}:${forceGrowth ? '1' : '0'}:${correlationRatio}`,
  [userId, autoIncrement, forceGrowth, correlationRatio]);

  // Use refs to avoid unnecessary re-renders
  const statsRef = useRef<StatsValues>({
    adsCount: MINIMUM_ADS_COUNT,
    revenueCount: MINIMUM_REVENUE_COUNT
  });
  
  // Track mount state
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  
  // Use caching to avoid redundant calculations
  const getInitialStats = () => {
    const now = Date.now();
    const cachedStats = statsCache[cacheKey];
    
    // Return cached values if recent enough
    if (cachedStats && now - cachedStats.timestamp < 10000) {
      return cachedStats.values;
    }
    
    try {
      // Force progression of values if necessary
      const initialStats = forceGrowth 
        ? ensureProgressiveValues() 
        : getDateConsistentStats();
      
      // Cache the result
      statsCache[cacheKey] = {
        values: initialStats,
        timestamp: now
      };
      
      return initialStats;
    } catch (error) {
      console.error("Error in getInitialStats:", error);
      return {
        adsCount: MINIMUM_ADS_COUNT,
        revenueCount: MINIMUM_REVENUE_COUNT
      };
    }
  };
  
  // Initialize state with stored values - use a function to compute initial state
  const [stats, setStats] = useState<StatsValues>(() => {
    const initialStats = getInitialStats();
    // Update ref
    statsRef.current = initialStats;
    return initialStats;
  });
  
  // Use ref to track if event listeners are set up
  const listenersSetupRef = useRef(false);
  
  // Update statistics from DOM events - ensure this runs only once
  useEffect(() => {
    // Avoid setting up listeners multiple times
    if (listenersSetupRef.current) return;
    listenersSetupRef.current = true;
    
    // Function to update statistics
    const handleStatsUpdate = (event: CustomEvent) => {
      if (!isMountedRef.current) return;
      
      if (event.detail && typeof event.detail === 'object') {
        const newAdsCount = event.detail.adsCount ?? statsRef.current.adsCount;
        const newRevenueCount = event.detail.revenueCount ?? statsRef.current.revenueCount;
        
        // Only update if values have changed significantly
        if (Math.abs(newAdsCount - statsRef.current.adsCount) > 0.5 ||
            Math.abs(newRevenueCount - statsRef.current.revenueCount) > 0.5) {
          
          // Update state with new values
          if (isMountedRef.current) {
            setStats(prevStats => {
              const newStats = {
                ...prevStats,
                adsCount: newAdsCount,
                revenueCount: newRevenueCount
              };
              
              // Update ref
              statsRef.current = newStats;
              
              // Update the cache
              statsCache[cacheKey] = {
                values: newStats,
                timestamp: Date.now()
              };
              
              return newStats;
            });
          }
        }
      }
    };
    
    // Listen for statistics update events with wrapped handler
    window.addEventListener('stats:update', handleStatsUpdate as EventListener);
    window.addEventListener('stats:sync', handleStatsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('stats:update', handleStatsUpdate as EventListener);
      window.removeEventListener('stats:sync', handleStatsUpdate as EventListener);
      listenersSetupRef.current = false;
    };
  }, [cacheKey]);
  
  // Return stable stats
  return stats;
};

export default usePersistentStats;
