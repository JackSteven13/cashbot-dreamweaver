
import { useState, useEffect, useMemo, useRef } from 'react';
import { useStatsInitialization } from './stats/useStatsInitialization';
import { useStatsAnimation } from './stats/useStatsAnimation';
import { useStatsCycleManagement } from '@/hooks/stats/useStatsCycleManagement';
import { 
  loadStoredValues, 
  incrementDateLinkedStats, 
  saveValues, 
  enforceMinimumStats,
  getDateConsistentStats
} from './stats/utils/storageManager';

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
  STATS_LAST_SYNC: 'stats_last_sync',
  STATS_AUTO_INCREMENT: 'stats_auto_increment_enabled'
};

export const useStatsCounter = ({
  dailyAdsTarget = 350000,
  dailyRevenueTarget = 1500000
}: UseStatsCounterParams): StatsCounterData => {
  // Utiliser useRef pour assurer la stabilité entre les rendus
  const stableValuesRef = useRef({
    initialized: false,
    syncInProgress: false,
    lastAutoIncrementTime: Date.now(),
    baseValues: {
      adsCount: MINIMUM_ADS_COUNT,
      revenueCount: MINIMUM_REVENUE_COUNT
    }
  });

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
  
  // Initialisation améliorée avec progression temporelle
  useEffect(() => {
    if (!countersInitialized) {
      // Récupérer des valeurs cohérentes basées sur la date
      const consistentStats = getDateConsistentStats();
      
      // Initialiser avec ces valeurs
      setAdsCount(consistentStats.adsCount);
      setRevenueCount(consistentStats.revenueCount);
      setDisplayedAdsCount(consistentStats.adsCount);
      setDisplayedRevenueCount(consistentStats.revenueCount);
      
      // Stocker les valeurs de base dans la référence stable
      stableValuesRef.current.baseValues = {
        adsCount: consistentStats.adsCount,
        revenueCount: consistentStats.revenueCount
      };
      
      setCountersInitialized(true);
      setIsFirstLoad(false);
      
      // S'assurer que les valeurs respectent le minimum
      enforceMinimumStats(MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT);
      
      console.log("Compteurs initialisés avec des valeurs cohérentes:", consistentStats);
    }
  }, []);
  
  // Traitement d'incrémentation automatique renforcé mais ralenti considérablement
  useEffect(() => {
    if (!countersInitialized) return;
    
    // Vérifie si l'auto-incrément est activé (par défaut: oui)
    const isAutoIncrementEnabled = localStorage.getItem(STORAGE_KEYS.STATS_AUTO_INCREMENT) !== 'false';
    
    if (!isAutoIncrementEnabled) {
      console.log("Auto-increment des statistiques désactivé");
      return;
    }
    
    // Pour garantir que les statistiques évoluent toujours, même sans interaction
    // mais avec des intervalles beaucoup plus longs (2-3 minutes)
    const autoIncrement = setInterval(() => {
      // Éviter les mises à jour simultanées
      if (stableValuesRef.current.syncInProgress) return;
      stableValuesRef.current.syncInProgress = true;
      
      const now = Date.now();
      const timeSinceLastIncrement = now - stableValuesRef.current.lastAutoIncrementTime;
      
      // Incrémenter périodiquement, avec une progression beaucoup plus lente
      if (timeSinceLastIncrement > 60000) { // Au moins 1 minute entre les incréments
        stableValuesRef.current.lastAutoIncrementTime = now;
        
        // Réduire drastiquement les incréments (1-3 vidéos maximum)
        const incrementedValues = {
          newAdsCount: adsCount + (Math.floor(Math.random() * 2) + 1), // 1-3 vidéos
          newRevenueCount: revenueCount + (Math.random() * 0.7 + 0.2) // 0.2-0.9€
        };
        
        // Mettre à jour les compteurs avec les nouvelles valeurs
        setAdsCount(incrementedValues.newAdsCount);
        setRevenueCount(incrementedValues.newRevenueCount);
        
        // Sauvegarder les valeurs pour la persistance
        saveValues(incrementedValues.newAdsCount, incrementedValues.newRevenueCount);
      }
      
      stableValuesRef.current.syncInProgress = false;
    }, 120000 + Math.floor(Math.random() * 60000)); // Entre 2 et 3 minutes
    
    return () => clearInterval(autoIncrement);
  }, [countersInitialized, adsCount, revenueCount]);

  // Save to session storage on beforeunload for better persistence
  useEffect(() => {
    const saveToSession = () => {
      try {
        sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT, displayedAdsCount.toString());
        sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, displayedRevenueCount.toString());
        
        // Sauvegarder aussi dans localStorage pour une persistance maximale
        saveValues(
          Math.max(displayedAdsCount, adsCount), 
          Math.max(displayedRevenueCount, revenueCount)
        );
      } catch (e) {
        console.error('Error saving counters to sessionStorage', e);
      }
    };
    
    window.addEventListener('beforeunload', saveToSession);
    return () => window.removeEventListener('beforeunload', saveToSession);
  }, [displayedAdsCount, displayedRevenueCount, adsCount, revenueCount]);
  
  // Animation et mises à jour périodiques, mais beaucoup plus lentes
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
    
    // Interval for periodic counter updates with progression temporelle
    // Ralenti significativement (5-7 minutes)
    const updateInterval = setInterval(() => {
      // Éviter les mises à jour simultanées
      if (stableValuesRef.current.syncInProgress) return;
      stableValuesRef.current.syncInProgress = true;
      
      // Incrémenter avec des valeurs très petites (1-3 vidéos maximum)
      const increment = {
        ads: Math.floor(Math.random() * 2) + 1, // 1-3
        revenue: (Math.random() * 0.7 + 0.2) // 0.2-0.9€
      };
      
      setAdsCount(prev => prev + increment.ads);
      setRevenueCount(prev => prev + increment.revenue);
      
      // Sauvegarder pour la persistance
      saveValues(adsCount + increment.ads, revenueCount + increment.revenue);
      
      stableValuesRef.current.syncInProgress = false;
    }, 300000 + Math.floor(Math.random() * 120000)); // 5-7 minutes
    
    // Schedule reset at midnight
    const resetTimeout = scheduleCycleUpdate();
    
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      clearInterval(updateInterval);
    };
  }, [animateCounters, incrementCountersRandomly, scheduleCycleUpdate, countersInitialized]);

  // Synchroniser avec visibilitychange pour la progression pendant l'inactivité
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && countersInitialized) {
        // Récupérer les valeurs stockées
        const consistentStats = getDateConsistentStats();
        
        // Utiliser les valeurs les plus élevées
        const newAdsCount = Math.max(adsCount, consistentStats.adsCount);
        const newRevenueCount = Math.max(revenueCount, consistentStats.revenueCount);
        
        // Mettre à jour si nécessaire
        if (newAdsCount > adsCount || newRevenueCount > revenueCount) {
          setAdsCount(newAdsCount);
          setRevenueCount(newRevenueCount);
          
          // Assurer une transition visuelle très lente
          setDisplayedAdsCount(prev => {
            const diff = newAdsCount - prev;
            // Limiter l'incrément à maximum 1 vidéo
            return prev + Math.min(1, Math.max(1, Math.floor(diff * 0.01)));
          });
          
          setDisplayedRevenueCount(prev => {
            const diff = newRevenueCount - prev;
            // Limiter à des petits incréments
            return prev + Math.min(0.25, Math.max(0.01, diff * 0.01));
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [countersInitialized, adsCount, revenueCount]);

  return useMemo(() => ({
    displayedAdsCount: Math.max(MINIMUM_ADS_COUNT, displayedAdsCount),
    displayedRevenueCount: Math.max(MINIMUM_REVENUE_COUNT, displayedRevenueCount)
  }), [displayedAdsCount, displayedRevenueCount]);
};

export default useStatsCounter;
