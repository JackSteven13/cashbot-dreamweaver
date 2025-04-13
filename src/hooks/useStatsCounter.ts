
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
    
    // Système d'animation repensé pour une animation plus lente et lisible
    let animationFrameId: number;
    let lastUpdateTime = 0;
    
    // Fonction d'animation avec des intervalles plus longs
    const updateAnimation = (timestamp: number) => {
      // Intervalle plus long entre les mises à jour (entre 4 et 6 secondes au lieu de 1.5-3)
      // pour ralentir significativement l'animation
      const updateInterval = Math.random() * 2000 + 4000;
      
      if (timestamp - lastUpdateTime > updateInterval || lastUpdateTime === 0) {
        animateCounters();
        lastUpdateTime = timestamp;
      }
      
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Intervalle variable pour les mises à jour des compteurs réels
    // mais avec des intervalles beaucoup plus longs
    const createUpdateInterval = () => {
      const minInterval = 10000; // Minimum 10 secondes (était 4000)
      const maxInterval = 20000; // Maximum 20 secondes (était 12000)
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
