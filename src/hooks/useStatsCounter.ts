
import { useState, useEffect, useMemo } from 'react';
import { useStatsInitialization } from './stats/useStatsInitialization';
import { useStatsAnimation } from './stats/useStatsAnimation';
import { useStatsCycleManagement } from '@/hooks/stats/useStatsCycleManagement';

interface UseStatsCounterParams {
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

interface StatsCounterData {
  displayedAdsCount: number;
  displayedRevenueCount: number;
}

// Minimum baseline values that should never be dropped below
const MINIMUM_ADS_COUNT = 40000;
const MINIMUM_REVENUE_COUNT = 50000;

// Storage keys for global counters
const GLOBAL_STORAGE_KEYS = {
  DISPLAYED_ADS_COUNT: 'displayed_ads_count',
  DISPLAYED_REVENUE_COUNT: 'displayed_revenue_count',
  STATS_LAST_SYNC: 'stats_last_sync'
};

export const useStatsCounter = ({
  dailyAdsTarget = 350000,
  dailyRevenueTarget = 1500000
}: UseStatsCounterParams): StatsCounterData => {
  const {
    adsCount,
    revenueCount,
    displayedAdsCount,
    displayedRevenueCount,
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount,
    initializeCounters
  } = useStatsInitialization({
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  const { animateCounters } = useStatsAnimation({
    adsCount,
    revenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount
  });
  
  const { scheduleCycleUpdate, incrementCountersRandomly } = useStatsCycleManagement({
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount,
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  // Track if we're on the same day to avoid resetting values incorrectly
  const [currentDate, setCurrentDate] = useState<string>(() => {
    return new Date().toDateString();
  });
  
  // Track initial load state
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Initial load protection and enhancement
  useEffect(() => {
    if (isFirstLoad) {
      // Force initialization to ensure values are always above minimums
      const storedAdsCount = parseInt(localStorage.getItem(GLOBAL_STORAGE_KEYS.DISPLAYED_ADS_COUNT) || '0', 10);
      const storedRevenueCount = parseInt(localStorage.getItem(GLOBAL_STORAGE_KEYS.DISPLAYED_REVENUE_COUNT) || '0', 10);
      
      // If stored values are below minimum, use minimums with a bit of randomization
      if (isNaN(storedAdsCount) || storedAdsCount < MINIMUM_ADS_COUNT || 
          isNaN(storedRevenueCount) || storedRevenueCount < MINIMUM_REVENUE_COUNT) {
        
        const initialAdsCount = MINIMUM_ADS_COUNT + Math.floor(Math.random() * 5000);
        const initialRevenueCount = MINIMUM_REVENUE_COUNT + Math.floor(Math.random() * 5000);
        
        // Update both local state and localStorage
        setAdsCount(initialAdsCount);
        setRevenueCount(initialRevenueCount);
        setDisplayedAdsCount(initialAdsCount);
        setDisplayedRevenueCount(initialRevenueCount);
        
        localStorage.setItem(GLOBAL_STORAGE_KEYS.DISPLAYED_ADS_COUNT, initialAdsCount.toString());
        localStorage.setItem(GLOBAL_STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, initialRevenueCount.toString());
      } else {
        // Use existing values if they're already above minimum
        setAdsCount(storedAdsCount);
        setRevenueCount(storedRevenueCount);
        setDisplayedAdsCount(storedAdsCount);
        setDisplayedRevenueCount(storedRevenueCount);
      }
      
      setIsFirstLoad(false);
    }
  }, [isFirstLoad, setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  useEffect(() => {
    // System of animation with reasonable update intervals
    let animationFrameId: number;
    
    // Animation function with reduced frequency
    const updateAnimation = () => {
      animateCounters();
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    // Start animation
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Interval for periodic counter updates (target values)
    // Augmentation très progressive avec des mises à jour plus espacées
    const updateInterval = setInterval(() => {
      incrementCountersRandomly();
    }, 300000 + Math.floor(Math.random() * 120000)); // Toutes les 5-7 minutes
    
    // Schedule reset at midnight
    const resetTimeout = scheduleCycleUpdate();
    
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      clearInterval(updateInterval);
    };
  }, [
    animateCounters,
    incrementCountersRandomly,
    scheduleCycleUpdate
  ]);
  
  // Save to global storage whenever displayed values change
  // Add protection to prevent values from decreasing unexpectedly
  useEffect(() => {
    // Ensure we never save values below our minimum thresholds
    const safeAdsCount = Math.max(MINIMUM_ADS_COUNT, displayedAdsCount);
    const safeRevenueCount = Math.max(MINIMUM_REVENUE_COUNT, displayedRevenueCount);
    
    // Get previous values to ensure we're not decreasing them
    const prevAdsCount = parseInt(localStorage.getItem(GLOBAL_STORAGE_KEYS.DISPLAYED_ADS_COUNT) || '0', 10);
    const prevRevenueCount = parseInt(localStorage.getItem(GLOBAL_STORAGE_KEYS.DISPLAYED_REVENUE_COUNT) || '0', 10);
    
    // Make sure we never go below our minimums
    const newAdsCount = Math.max(MINIMUM_ADS_COUNT, Math.max(prevAdsCount, Math.round(safeAdsCount)));
    const newRevenueCount = Math.max(MINIMUM_REVENUE_COUNT, Math.max(prevRevenueCount, Math.round(safeRevenueCount)));
    
    // Always update localStorage with the highest value
    localStorage.setItem(GLOBAL_STORAGE_KEYS.DISPLAYED_ADS_COUNT, newAdsCount.toString());
    localStorage.setItem(GLOBAL_STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, newRevenueCount.toString());
    
    // Update the sync date
    localStorage.setItem('stats_last_sync_date', currentDate);
    
    // If the stored value is higher than our current state, update the state too
    if (newAdsCount > safeAdsCount) {
      setDisplayedAdsCount(newAdsCount);
      setAdsCount(newAdsCount);
    }
    
    if (newRevenueCount > safeRevenueCount) {
      setDisplayedRevenueCount(newRevenueCount);
      setRevenueCount(newRevenueCount);
    }
  }, [displayedAdsCount, displayedRevenueCount, currentDate, setDisplayedAdsCount, setAdsCount, setDisplayedRevenueCount, setRevenueCount]);

  return useMemo(() => ({
    // Ensure we never return values below minimums
    displayedAdsCount: Math.max(MINIMUM_ADS_COUNT, displayedAdsCount),
    displayedRevenueCount: Math.max(MINIMUM_REVENUE_COUNT, displayedRevenueCount)
  }), [displayedAdsCount, displayedRevenueCount]);
};
