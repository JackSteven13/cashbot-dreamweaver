
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
  
  useEffect(() => {
    initializeCounters();
    
    // Système d'animation redessiné pour être plus naturel et aléatoire
    let animationFrameId: number;
    let lastUpdateTime = 0;
    
    const updateAnimation = (timestamp: number) => {
      // Intervalle aléatoire entre les mises à jour pour simuler des publicités de durées variables
      const updateInterval = Math.random() * 1000 + 1000; // Entre 1 et 2 secondes
      
      if (timestamp - lastUpdateTime > updateInterval || lastUpdateTime === 0) {
        animateCounters();
        lastUpdateTime = timestamp;
      }
      
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Mises à jour des compteurs réels à intervalles irréguliers pour simuler des publicités de durées différentes
    const scheduleNextIncrement = () => {
      const randomInterval = Math.floor(Math.random() * 4000) + 6000; // Entre 6 et 10 secondes
      return setTimeout(() => {
        incrementCountersRandomly();
        const nextTimeout = scheduleNextIncrement();
        return nextTimeout;
      }, randomInterval);
    };
    
    let incrementTimeoutId = scheduleNextIncrement();
    
    const resetTimeout = scheduleCycleUpdate();
    
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      clearTimeout(incrementTimeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [
    initializeCounters,
    animateCounters,
    incrementCountersRandomly,
    scheduleCycleUpdate
  ]);

  return useMemo(() => ({
    displayedAdsCount,
    displayedRevenueCount
  }), [displayedAdsCount, displayedRevenueCount]);
};
