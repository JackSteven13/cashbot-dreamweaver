
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
    
    // Système d'animation repensé pour une plus grande fluidité et variabilité
    let animationFrameId: number;
    let lastUpdateTime = 0;
    
    // Fonction d'animation avec variation de fréquence
    const updateAnimation = (timestamp: number) => {
      // Variation du temps entre les mises à jour (entre 1.5 et 3 secondes)
      // Simule des agents plus ou moins actifs selon les moments
      const updateInterval = Math.random() * 1500 + 1500;
      
      if (timestamp - lastUpdateTime > updateInterval || lastUpdateTime === 0) {
        animateCounters();
        lastUpdateTime = timestamp;
      }
      
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Intervalle variable pour les mises à jour des compteurs réels
    // Simule le rythme de travail irrégulier des agents
    const createUpdateInterval = () => {
      const minInterval = 4000; // Minimum 4 secondes
      const maxInterval = 12000; // Maximum 12 secondes
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
