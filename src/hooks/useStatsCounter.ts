
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
    
    // Système d'animation complètement redessiné pour des mises à jour très lentes
    let animationFrameId: number;
    let lastUpdateTime = 0;
    
    // Fonction d'animation avec des intervalles extrêmement longs (45-90 secondes)
    const updateAnimation = (timestamp: number) => {
      // Intervalle très long entre les mises à jour d'affichage (45-90 secondes)
      const updateInterval = Math.random() * 45000 + 45000;
      
      if (timestamp - lastUpdateTime > updateInterval || lastUpdateTime === 0) {
        animateCounters();
        lastUpdateTime = timestamp;
      }
      
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Intervalle variable pour les mises à jour réelles des compteurs avec des intervalles très longs
    const createUpdateInterval = () => {
      const minInterval = 180000; // Minimum 3 minutes
      const maxInterval = 300000; // Maximum 5 minutes
      const randomInterval = Math.floor(Math.random() * (maxInterval - minInterval) + minInterval);
      
      setTimeout(() => {
        incrementCountersRandomly();
        createUpdateInterval(); // Planifier la prochaine mise à jour avec un nouvel intervalle aléatoire
      }, randomInterval);
    };
    
    createUpdateInterval(); // Démarrer le cycle d'intervalles variables
    
    const resetTimeout = scheduleCycleUpdate();
    
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
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
