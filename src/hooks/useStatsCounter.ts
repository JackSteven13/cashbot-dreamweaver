import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useStatsInitialization } from './stats/useStatsInitialization';
import { useStatsAnimation } from './stats/useStatsAnimation';
import { useStatsCycleManagement } from '@/hooks/stats/useStatsCycleManagement';
import { 
  loadStoredValues, 
  incrementDateLinkedStats, 
  saveValues, 
  enforceMinimumStats,
  getDateConsistentStats,
  ensureProgressiveValues
} from './stats/utils/storageManager';

interface UseStatsCounterParams {
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

interface StatsCounterData {
  displayedAdsCount: number;
  displayedRevenueCount: number;
}

// Valeurs minimales impressionnantes et variables en fonction du temps
const getMinimumValues = () => {
  // Récupérer la date de première utilisation
  const firstUseDate = localStorage.getItem('first_use_date');
  if (!firstUseDate) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 60);
    try {
      localStorage.setItem('first_use_date', pastDate.toISOString());
    } catch (e) {
      console.error("Failed to save first use date:", e);
    }
  }
  
  // Calculer le nombre de jours depuis l'installation
  let diffDays = 60; // Default value
  try {
    const installDate = new Date(localStorage.getItem('first_use_date') || '');
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - installDate.getTime());
    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    console.error("Failed to calculate diff days:", e);
  }
  
  // Facteur de progression basé sur l'ancienneté - progression pour atteindre des valeurs impressionnantes
  const progressFactor = Math.min(1 + (diffDays * 0.004), 1.8); // max 1.8x après 200 jours
  
  return {
    ADS_COUNT: Math.floor(95000 * progressFactor),
    REVENUE_COUNT: 75000 * progressFactor
  };
};

// Storage keys for global counters
const STORAGE_KEYS = {
  DISPLAYED_ADS_COUNT: 'displayed_ads_count',
  DISPLAYED_REVENUE_COUNT: 'displayed_revenue_count',
  STATS_LAST_SYNC: 'stats_last_sync',
  STATS_AUTO_INCREMENT: 'stats_auto_increment_enabled'
};

export const useStatsCounter = ({
  dailyAdsTarget = 15000,
  dailyRevenueTarget = 12000
}: UseStatsCounterParams): StatsCounterData => {
  // Get minimum values but use useMemo to avoid recalculation on every render
  const minimumValues = useMemo(() => getMinimumValues(), []);
  const { ADS_COUNT: MINIMUM_ADS_COUNT, REVENUE_COUNT: MINIMUM_REVENUE_COUNT } = minimumValues;
  
  // Keep stable references with useRef
  const stableValuesRef = useRef({
    initialized: false,
    syncInProgress: false,
    lastAutoIncrementTime: Date.now(),
    lastLocationUpdateTime: Date.now(),
    baseValues: {
      adsCount: MINIMUM_ADS_COUNT,
      revenueCount: MINIMUM_REVENUE_COUNT
    }
  });

  // Initialize state with functions to prevent frequent re-computations
  const [adsCount, setAdsCount] = useState(() => {
    ensureProgressiveValues();
    const consistentStats = getDateConsistentStats();
    return Math.max(consistentStats.adsCount, MINIMUM_ADS_COUNT);
  });

  const [revenueCount, setRevenueCount] = useState(() => {
    ensureProgressiveValues();
    const consistentStats = getDateConsistentStats();
    return Math.max(consistentStats.revenueCount, MINIMUM_REVENUE_COUNT);
  });

  const [displayedAdsCount, setDisplayedAdsCount] = useState(() => adsCount);
  const [displayedRevenueCount, setDisplayedRevenueCount] = useState(() => revenueCount);
  
  // Stabilize references
  const isFirstLoadRef = useRef(true);
  const countersInitializedRef = useRef(false);
  
  // Memoize animation function
  const animateCounters = useCallback((targetAdsCount: number, targetRevenueCount: number) => {
    setDisplayedAdsCount(targetAdsCount);
    setDisplayedRevenueCount(targetRevenueCount);
  }, []);
  
  // First load initialization - run only once
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      
      ensureProgressiveValues();
      const consistentStats = getDateConsistentStats();
      
      setAdsCount(consistentStats.adsCount);
      setRevenueCount(consistentStats.revenueCount);
      setDisplayedAdsCount(consistentStats.adsCount);
      setDisplayedRevenueCount(consistentStats.revenueCount);
      
      saveValues(consistentStats.adsCount, consistentStats.revenueCount, false);
      
      countersInitializedRef.current = true;
    }
  }, []);
  
  // Visibility change handling with stable dependencies
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && countersInitializedRef.current) {
        ensureProgressiveValues();
        const refreshedStats = getDateConsistentStats();
        
        setAdsCount(refreshedStats.adsCount);
        setRevenueCount(refreshedStats.revenueCount);
        setDisplayedAdsCount(refreshedStats.adsCount);
        setDisplayedRevenueCount(refreshedStats.revenueCount);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Throttled incrementation with ref-based logic to prevent excessive updates
  useEffect(() => {
    if (!countersInitializedRef.current) return;
    
    // Delayed first update
    const initialTimeout = setTimeout(() => {
      const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
      
      setAdsCount(newAdsCount);
      setRevenueCount(newRevenueCount);
      setDisplayedAdsCount(newAdsCount);
      setDisplayedRevenueCount(newRevenueCount);
      
      stableValuesRef.current.lastAutoIncrementTime = Date.now();
    }, 30000);
    
    // Less frequent updates with time limiting
    const incrementInterval = setInterval(() => {
      const now = Date.now();
      
      // Only update after significant time has passed
      if (now - stableValuesRef.current.lastAutoIncrementTime > 300000) {
        // Add randomness to increments
        if (Math.random() > 0.4) {
          stableValuesRef.current.lastAutoIncrementTime = now;
          
          const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
          
          setAdsCount(prevAds => {
            // Only update if value actually changes
            return newAdsCount > prevAds ? newAdsCount : prevAds;
          });
          
          setRevenueCount(prevRevenue => {
            return newRevenueCount > prevRevenue ? newRevenueCount : prevRevenue;
          });
          
          // Animate to new values
          animateCounters(newAdsCount, newRevenueCount);
          
          // Save for persistence
          try {
            localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
            localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
          } catch (e) {
            console.error("Failed to save displayed counts:", e);
          }
        }
      }
    }, 300000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(incrementInterval);
    };
  }, [animateCounters]);
  
  // Save values on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveValues(adsCount, revenueCount, false);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [adsCount, revenueCount]);

  return {
    displayedAdsCount,
    displayedRevenueCount
  };
};

export default useStatsCounter;
