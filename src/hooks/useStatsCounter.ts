
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
    // Initialiser les compteurs avec des valeurs réalistes
    initializeCounters();
    
    // Système d'animation avec des mises à jour à intervalles raisonnables
    let animationFrameId: number;
    
    // Fonction d'animation
    const updateAnimation = () => {
      animateCounters();
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    // Démarrer l'animation
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Intervalle pour les mises à jour périodiques des compteurs (valeurs cibles)
    // Augmenter l'intervalle à 40 secondes pour ralentir encore plus la génération
    const updateInterval = setInterval(() => {
      incrementCountersRandomly();
    }, 40000); // Toutes les 40 secondes pour des mises à jour plus lentes
    
    // Planifier la réinitialisation à minuit
    const resetTimeout = scheduleCycleUpdate();
    
    // Synchronisation initiale des compteurs affichés avec les valeurs cibles
    setDisplayedAdsCount(adsCount);
    setDisplayedRevenueCount(revenueCount);
    
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      clearInterval(updateInterval);
    };
  }, [
    initializeCounters,
    animateCounters,
    incrementCountersRandomly,
    scheduleCycleUpdate,
    adsCount,
    revenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount
  ]);

  return useMemo(() => ({
    displayedAdsCount,
    displayedRevenueCount
  }), [displayedAdsCount, displayedRevenueCount]);
};
