
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
  
  // Initial load protection
  useEffect(() => {
    if (isFirstLoad && (displayedAdsCount === 0 || displayedRevenueCount === 0)) {
      // Forced initialization on first load to prevent flickering with 0 values
      initializeCounters();
      setIsFirstLoad(false);
    }
  }, [isFirstLoad, displayedAdsCount, displayedRevenueCount, initializeCounters]);
  
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
    if (displayedAdsCount > 0 && displayedRevenueCount > 0) {
      // Get previous values to ensure we're not decreasing them
      const prevAdsCount = parseInt(localStorage.getItem(GLOBAL_STORAGE_KEYS.DISPLAYED_ADS_COUNT) || '0', 10);
      const prevRevenueCount = parseInt(localStorage.getItem(GLOBAL_STORAGE_KEYS.DISPLAYED_REVENUE_COUNT) || '0', 10);
      
      // Make sure we never go below our minimums
      const newAdsCount = Math.max(40000, Math.round(displayedAdsCount)); 
      const newRevenueCount = Math.max(50000, Math.round(displayedRevenueCount));
      
      // Only update if new values are higher (or we have no previous values)
      // This prevents any decreases during page reloads
      if (newAdsCount >= prevAdsCount || prevAdsCount === 0) {
        localStorage.setItem(GLOBAL_STORAGE_KEYS.DISPLAYED_ADS_COUNT, newAdsCount.toString());
      }
      
      if (newRevenueCount >= prevRevenueCount || prevRevenueCount === 0) {
        localStorage.setItem(GLOBAL_STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, newRevenueCount.toString());
      }
      
      // Update the sync date
      localStorage.setItem('stats_last_sync_date', currentDate);
    }
  }, [displayedAdsCount, displayedRevenueCount, currentDate]);

  return useMemo(() => ({
    // Si les valeurs sont trop basses, utiliser les minimums
    displayedAdsCount: Math.max(40000, displayedAdsCount),
    displayedRevenueCount: Math.max(50000, displayedRevenueCount)
  }), [displayedAdsCount, displayedRevenueCount]);
};
