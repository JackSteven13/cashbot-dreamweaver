
import { useState, useEffect, useMemo } from 'react';
import { useStatsInitialization } from './stats/useStatsInitialization';
import { useStatsAnimation } from './stats/useStatsAnimation';
import { useStatsCycleManagement } from './stats/useStatsCycleManagement';

interface UseStatsCounterParams {
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

interface StatsCounterData {
  displayedAdsCount: number;
  displayedRevenueCount: number;
}

export const useStatsCounter = ({
  dailyAdsTarget = 65000,
  dailyRevenueTarget = 186000
}: UseStatsCounterParams): StatsCounterData => {
  // Use the initialization hook
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
  
  // Use the animation hook
  const { animateCounters } = useStatsAnimation({
    adsCount,
    revenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount
  });
  
  // Use the cycle management hook
  const { scheduleCycleUpdate, incrementCountersRandomly } = useStatsCycleManagement({
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount,
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  // Set up effects
  useEffect(() => {
    // Initialize counters based on current time
    initializeCounters();
    
    // Animation frame for smooth counter updates
    let animationFrameId: number;
    const updateAnimation = () => {
      animateCounters();
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    // Start animation
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Schedule periodic real data updates (moins fréquents pour moins d'agitation)
    const activityInterval = setInterval(incrementCountersRandomly, 3000);
    
    // Schedule reset at the end of the 17-day cycle
    const resetTimeout = scheduleCycleUpdate();
    
    // Cleanup
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      clearInterval(activityInterval);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [
    initializeCounters,
    animateCounters,
    incrementCountersRandomly,
    scheduleCycleUpdate
  ]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    displayedAdsCount,
    displayedRevenueCount
  }), [displayedAdsCount, displayedRevenueCount]);
};
