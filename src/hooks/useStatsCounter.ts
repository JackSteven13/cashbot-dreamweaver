
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
  DISPLAYED_ADS_COUNT: 'global_displayed_ads_count',
  DISPLAYED_REVENUE_COUNT: 'global_displayed_revenue_count'
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
  
  // Immediately synchronize with global storage on load
  useEffect(() => {
    // Load from global storage first
    const storedAds = localStorage.getItem(GLOBAL_STORAGE_KEYS.DISPLAYED_ADS_COUNT);
    const storedRevenue = localStorage.getItem(GLOBAL_STORAGE_KEYS.DISPLAYED_REVENUE_COUNT);
    
    if (storedAds && storedRevenue) {
      const parsedAds = parseInt(storedAds, 10);
      const parsedRevenue = parseInt(storedRevenue, 10);
      
      if (!isNaN(parsedAds) && !isNaN(parsedRevenue) && parsedAds > 0 && parsedRevenue > 0) {
        // Force values to be loaded from global storage
        setAdsCount(parsedAds);
        setRevenueCount(parsedRevenue);
        setDisplayedAdsCount(parsedAds);
        setDisplayedRevenueCount(parsedRevenue);
        console.log(`Loaded from global storage: Ads=${parsedAds}, Revenue=${parsedRevenue}`);
      } else {
        // If global storage has invalid values, initialize normally
        initializeCounters();
      }
    } else {
      // If no global storage values, initialize normally
      initializeCounters();
    }
  }, []);
  
  useEffect(() => {
    // Initialiser les compteurs avec des valeurs réalistes
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
    // Increase interval dramatically to 2-4 minutes for much slower and more natural updates
    const updateInterval = setInterval(() => {
      incrementCountersRandomly();
    }, 120000 + Math.floor(Math.random() * 120000)); // Every 2-4 minutes for much slower updates
    
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
  useEffect(() => {
    if (displayedAdsCount > 0 && displayedRevenueCount > 0) {
      localStorage.setItem(GLOBAL_STORAGE_KEYS.DISPLAYED_ADS_COUNT, Math.round(displayedAdsCount).toString());
      localStorage.setItem(GLOBAL_STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, Math.round(displayedRevenueCount).toString());
    }
  }, [displayedAdsCount, displayedRevenueCount]);

  return useMemo(() => ({
    displayedAdsCount,
    displayedRevenueCount
  }), [displayedAdsCount, displayedRevenueCount]);
};
