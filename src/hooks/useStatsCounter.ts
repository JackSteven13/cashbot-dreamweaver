
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
  
  // Prevent accidental resets when component remounts
  const [initialized, setInitialized] = useState(false);
  
  // Immediately synchronize with global storage on load
  useEffect(() => {
    if (initialized) return;
    
    // Check if we need to reset for a new day
    const today = new Date().toDateString();
    const lastSyncDate = localStorage.getItem('stats_last_sync_date') || '';
    
    if (lastSyncDate !== today) {
      console.log(`New day detected (${today}), resetting counters from previous day (${lastSyncDate})`);
      
      // It's a new day, reset properly
      localStorage.setItem('stats_last_sync_date', today);
      setCurrentDate(today);
      
      // Initialize with fresh values
      initializeCounters();
    } else {
      // Same day, load from global storage
      const storedAds = localStorage.getItem(GLOBAL_STORAGE_KEYS.DISPLAYED_ADS_COUNT);
      const storedRevenue = localStorage.getItem(GLOBAL_STORAGE_KEYS.DISPLAYED_REVENUE_COUNT);
      
      if (storedAds && storedRevenue) {
        const parsedAds = parseInt(storedAds, 10);
        const parsedRevenue = parseInt(storedRevenue, 10);
        
        if (!isNaN(parsedAds) && !isNaN(parsedRevenue) && parsedAds > 0 && parsedRevenue > 0) {
          // Force values to be loaded from global storage
          console.log(`Loaded from global storage: Ads=${parsedAds}, Revenue=${parsedRevenue}`);
          setAdsCount(parsedAds);
          setRevenueCount(parsedRevenue);
          setDisplayedAdsCount(parsedAds);
          setDisplayedRevenueCount(parsedRevenue);
        } else {
          console.log("Invalid stored values, initializing counters");
          initializeCounters();
        }
      } else {
        console.log("No stored values found, initializing counters");
        initializeCounters();
      }
    }
    
    setInitialized(true);
  }, []);
  
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
      
      // Only update if new values are higher or we don't have previous values
      const newAdsCount = Math.round(displayedAdsCount);
      const newRevenueCount = Math.round(displayedRevenueCount);
      
      // Never allow values to decrease unless it's a new day
      if (newAdsCount >= prevAdsCount || currentDate !== localStorage.getItem('stats_last_sync_date')) {
        localStorage.setItem(GLOBAL_STORAGE_KEYS.DISPLAYED_ADS_COUNT, newAdsCount.toString());
      }
      
      if (newRevenueCount >= prevRevenueCount || currentDate !== localStorage.getItem('stats_last_sync_date')) {
        localStorage.setItem(GLOBAL_STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, newRevenueCount.toString());
      }
      
      // Update the sync date
      localStorage.setItem('stats_last_sync_date', currentDate);
    }
  }, [displayedAdsCount, displayedRevenueCount, currentDate]);

  return useMemo(() => ({
    displayedAdsCount,
    displayedRevenueCount
  }), [displayedAdsCount, displayedRevenueCount]);
};
