
import { useState, useEffect, useMemo } from 'react';
import { useStatsInitialization } from './stats/useStatsInitialization';
import { useStatsAnimation } from './stats/useStatsAnimation';
import { useStatsCycleManagement } from '@/hooks/stats/useStatsCycleManagement';
import { loadStoredValues, incrementDateLinkedStats } from './stats/utils/storageManager';

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
const STORAGE_KEYS = {
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
  
  // Track initial load state
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [countersInitialized, setCountersInitialized] = useState(false);
  
  // Load date-based stats on mount
  useEffect(() => {
    if (!countersInitialized) {
      const dateBasedStats = loadStoredValues();
      
      if (dateBasedStats.hasStoredValues) {
        // Utiliser les valeurs dérivées de la date du jour
        setAdsCount(dateBasedStats.adsCount);
        setRevenueCount(dateBasedStats.revenueCount);
        setDisplayedAdsCount(dateBasedStats.adsCount);
        setDisplayedRevenueCount(dateBasedStats.revenueCount);
        setCountersInitialized(true);
        setIsFirstLoad(false);
        
        console.log("Statistiques initialisées avec les valeurs liées à la date:", dateBasedStats);
      }
    }
  }, [countersInitialized]);
  
  // Save to session storage on beforeunload to ensure values persist across refreshes
  useEffect(() => {
    const saveToSession = () => {
      try {
        sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT, displayedAdsCount.toString());
        sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, displayedRevenueCount.toString());
      } catch (e) {
        console.error('Error saving counters to sessionStorage', e);
      }
    };
    
    window.addEventListener('beforeunload', saveToSession);
    return () => window.removeEventListener('beforeunload', saveToSession);
  }, [displayedAdsCount, displayedRevenueCount]);
  
  // Animation and periodic updates
  useEffect(() => {
    if (!countersInitialized) return;
    
    // Animation frame for smooth transitions
    let animationFrameId: number;
    const updateAnimation = () => {
      animateCounters();
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    // Start animation
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Interval for periodic counter updates using date-linked stats
    const updateInterval = setInterval(() => {
      // Incrémenter les statistiques liées à la date
      const newValues = incrementDateLinkedStats();
      
      // Mettre à jour les compteurs avec les nouvelles valeurs
      setAdsCount(newValues.adsCount);
      setRevenueCount(newValues.revenueCount);
    }, 60000 + Math.floor(Math.random() * 30000)); // Toutes les 60-90 secondes
    
    // Schedule reset at midnight
    const resetTimeout = scheduleCycleUpdate();
    
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      clearInterval(updateInterval);
    };
  }, [animateCounters, incrementCountersRandomly, scheduleCycleUpdate, countersInitialized]);

  return useMemo(() => ({
    displayedAdsCount: Math.max(MINIMUM_ADS_COUNT, displayedAdsCount),
    displayedRevenueCount: Math.max(MINIMUM_REVENUE_COUNT, displayedRevenueCount)
  }), [displayedAdsCount, displayedRevenueCount]);
};
