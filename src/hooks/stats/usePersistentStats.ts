
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
  
  // Use caching to avoid redundant calculations
  const getInitialStats = () => {
    const now = Date.now();
    const cachedStats = statsCache[cacheKey];
    
    // Return cached values if recent enough
    if (cachedStats && now - cachedStats.timestamp < 5000) {
      return cachedStats.values;
    }
    
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
  
  // Update statistics from DOM events
  useEffect(() => {
    // Avoid setting up listeners multiple times
    if (listenersSetupRef.current) return;
    listenersSetupRef.current = true;
    
    // Function to update statistics
    const handleStatsUpdate = (event: CustomEvent) => {
      if (event.detail && typeof event.detail === 'object') {
        // Update state with new values
        setStats(prevStats => {
          const newStats = {
            ...prevStats,
            adsCount: event.detail.adsCount ?? prevStats.adsCount,
            revenueCount: event.detail.revenueCount ?? prevStats.revenueCount
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
    };
    
    // Listen for statistics update events
    window.addEventListener('stats:update', handleStatsUpdate as EventListener);
    window.addEventListener('stats:sync', handleStatsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('stats:update', handleStatsUpdate as EventListener);
      window.removeEventListener('stats:sync', handleStatsUpdate as EventListener);
      listenersSetupRef.current = false;
    };
  }, [cacheKey]);
  
  return stats;
};

export default usePersistentStats;
