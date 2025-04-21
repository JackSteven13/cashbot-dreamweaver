
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

// Valeurs minimales plus élevées et variables en fonction du temps
const getMinimumValues = () => {
  // Récupérer la date de première utilisation
  const firstUseDate = localStorage.getItem('first_use_date');
  if (!firstUseDate) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 90);
    localStorage.setItem('first_use_date', pastDate.toISOString());
  }
  
  // Calculer le nombre de jours depuis l'installation
  const installDate = new Date(localStorage.getItem('first_use_date') || '');
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - installDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Facteur de progression basé sur l'ancienneté
  const progressFactor = Math.min(1 + (diffDays * 0.01), 3); // max 3x après 200 jours
  
  return {
    ADS_COUNT: Math.floor(60000 * progressFactor),
    REVENUE_COUNT: 55000 * progressFactor
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
  dailyAdsTarget = 35000,
  dailyRevenueTarget = 15000
}: UseStatsCounterParams): StatsCounterData => {
  // Récupérer les valeurs minimales dynamiques
  const { ADS_COUNT: MINIMUM_ADS_COUNT, REVENUE_COUNT: MINIMUM_REVENUE_COUNT } = getMinimumValues();
  
  // Utiliser useRef pour assurer la stabilité entre les rendus
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
  
  // Initialisation cohérente avec les valeurs minimales dynamiques
  useEffect(() => {
    if (!countersInitialized) {
      // Récupérer des valeurs cohérentes basées sur la date
      const consistentStats = getDateConsistentStats();
      
      // Initialiser avec ces valeurs mais s'assurer qu'elles respectent les minimums dynamiques
      setAdsCount(Math.max(consistentStats.adsCount, MINIMUM_ADS_COUNT));
      setRevenueCount(Math.max(consistentStats.revenueCount, MINIMUM_REVENUE_COUNT));
      setDisplayedAdsCount(Math.max(consistentStats.adsCount, MINIMUM_ADS_COUNT));
      setDisplayedRevenueCount(Math.max(consistentStats.revenueCount, MINIMUM_REVENUE_COUNT));
      
      // Stocker les valeurs de base dans la référence stable
      stableValuesRef.current.baseValues = {
        adsCount: Math.max(consistentStats.adsCount, MINIMUM_ADS_COUNT),
        revenueCount: Math.max(consistentStats.revenueCount, MINIMUM_REVENUE_COUNT)
      };
      
      setCountersInitialized(true);
      setIsFirstLoad(false);
      
      // S'assurer que les valeurs respectent le minimum
      enforceMinimumStats(MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT);
      
      console.log("Compteurs initialisés avec des valeurs cohérentes et progressives:", {
        adsCount: Math.max(consistentStats.adsCount, MINIMUM_ADS_COUNT),
        revenueCount: Math.max(consistentStats.revenueCount, MINIMUM_REVENUE_COUNT)
      });
    }
  }, [MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT]);
  
  // Synchroniser les incréments avec le feed des publicités
  useEffect(() => {
    if (!countersInitialized) return;
    
    const handleLocationAdded = (event: Event) => {
      // Limiter les mises à jour (10 secondes minimum entre chaque)
      const now = Date.now();
      if (now - stableValuesRef.current.lastLocationUpdateTime < 10000) {
        return;
      }
      stableValuesRef.current.lastLocationUpdateTime = now;
      
      // Incrémenter après un délai pour simuler l'analyse
      setTimeout(() => {
        // Incréments plus importants basés sur l'ancienneté
        const { ADS_COUNT: minAds } = getMinimumValues();
        const adsIncrement = Math.floor(Math.random() * 5) + 1;
        const adValue = Math.random() * 0.5 + 0.2;
        
        const newAdsCount = adsCount + adsIncrement;
        const newRevenueCount = revenueCount + adValue;
        
        setAdsCount(Math.max(newAdsCount, minAds));
        setRevenueCount(Math.max(newRevenueCount, MINIMUM_REVENUE_COUNT));
        
        // Sauvegarder les valeurs
        saveValues(Math.max(newAdsCount, minAds), Math.max(newRevenueCount, MINIMUM_REVENUE_COUNT));
      }, 1000 + Math.random() * 2000);
    };
    
    window.addEventListener('location:added', handleLocationAdded);
    return () => window.removeEventListener('location:added', handleLocationAdded);
  }, [countersInitialized, adsCount, revenueCount, MINIMUM_REVENUE_COUNT]);
  
  // Auto-incrémentation plus agressive
  useEffect(() => {
    if (!countersInitialized) return;
    
    // Vérifie si l'auto-incrément est activé (par défaut: oui)
    const isAutoIncrementEnabled = localStorage.getItem(STORAGE_KEYS.STATS_AUTO_INCREMENT) !== 'false';
    
    if (!isAutoIncrementEnabled) {
      console.log("Auto-increment des statistiques désactivé");
      return;
    }
    
    // Progression avec des intervalles plus courts (5-10 minutes)
    const autoIncrement = setInterval(() => {
      // Éviter les mises à jour simultanées
      if (stableValuesRef.current.syncInProgress) return;
      stableValuesRef.current.syncInProgress = true;
      
      const now = Date.now();
      const timeSinceLastIncrement = now - stableValuesRef.current.lastAutoIncrementTime;
      
      // Incrémenter plus souvent
      if (timeSinceLastIncrement > 300000) { // 5 minutes entre les incréments
        stableValuesRef.current.lastAutoIncrementTime = now;
        
        // Probabilité plus élevée (30% de chance)
        if (Math.random() > 0.7) { 
          // Incréments plus significatifs
          const adsIncrease = Math.floor(Math.random() * 5) + 3;
          const revenueIncrease = Math.random() * 0.4 + 0.3;
          
          const incrementedValues = {
            newAdsCount: adsCount + adsIncrease,
            newRevenueCount: revenueCount + revenueIncrease
          };
          
          // Mettre à jour les compteurs
          setAdsCount(incrementedValues.newAdsCount);
          setRevenueCount(incrementedValues.newRevenueCount);
          
          // Simuler une nouvelle entrée dans le feed
          window.dispatchEvent(new CustomEvent('location:added'));
          
          // Sauvegarder les valeurs
          saveValues(incrementedValues.newAdsCount, incrementedValues.newRevenueCount);
        }
      }
      
      stableValuesRef.current.syncInProgress = false;
    }, 300000 + Math.floor(Math.random() * 300000)); // Entre 5 et 10 minutes
    
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
          Math.max(displayedAdsCount, adsCount, MINIMUM_ADS_COUNT), 
          Math.max(displayedRevenueCount, revenueCount, MINIMUM_REVENUE_COUNT)
        );
      } catch (e) {
        console.error('Error saving counters to sessionStorage', e);
      }
    };
    
    window.addEventListener('beforeunload', saveToSession);
    return () => window.removeEventListener('beforeunload', saveToSession);
  }, [displayedAdsCount, displayedRevenueCount, adsCount, revenueCount, MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT]);
  
  // Animation et mises à jour périodiques
  useEffect(() => {
    if (!countersInitialized) return;
    
    // Animation frame rate optimisé
    let animationFrameId: number;
    let lastFrameTime = 0;
    
    const updateAnimation = (timestamp: number) => {
      // Optimiser le framerate (1 frame par seconde)
      if (timestamp - lastFrameTime > 1000) {
        lastFrameTime = timestamp;
        animateCounters();
      }
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    // Start animation avec framerate optimisé
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Mises à jour périodiques plus fréquentes (15-20 minutes)
    const updateInterval = setInterval(() => {
      // Éviter les mises à jour simultanées
      if (stableValuesRef.current.syncInProgress) return;
      stableValuesRef.current.syncInProgress = true;
      
      // Probabilité d'incrément plus élevée (20% de chance)
      if (Math.random() > 0.8) {
        // Incréments plus significatifs
        const adsIncrease = Math.floor(Math.random() * 10) + 5;
        const revenueIncrease = Math.random() * 0.5 + 0.3;
        
        setAdsCount(prev => Math.max(prev + adsIncrease, MINIMUM_ADS_COUNT));
        setRevenueCount(prev => Math.max(prev + revenueIncrease, MINIMUM_REVENUE_COUNT));
        
        // Simuler une nouvelle entrée dans le feed
        window.dispatchEvent(new CustomEvent('location:added'));
        
        // Sauvegarder
        saveValues(
          Math.max(adsCount + adsIncrease, MINIMUM_ADS_COUNT), 
          Math.max(revenueCount + revenueIncrease, MINIMUM_REVENUE_COUNT)
        );
      }
      
      stableValuesRef.current.syncInProgress = false;
    }, 900000 + Math.floor(Math.random() * 300000)); // 15-20 minutes
    
    // Reset at midnight
    const resetTimeout = scheduleCycleUpdate();
    
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      clearInterval(updateInterval);
    };
  }, [animateCounters, incrementCountersRandomly, scheduleCycleUpdate, countersInitialized, MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT, adsCount, revenueCount]);

  // Synchroniser avec visibilitychange pour progression continue
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && countersInitialized) {
        // Récupérer les valeurs stockées
        const consistentStats = getDateConsistentStats();
        
        // Utiliser les valeurs les plus élevées
        const newAdsCount = Math.max(
          adsCount, 
          consistentStats.adsCount,
          MINIMUM_ADS_COUNT
        );
        
        const newRevenueCount = Math.max(
          revenueCount, 
          consistentStats.revenueCount,
          MINIMUM_REVENUE_COUNT
        );
        
        // Mettre à jour si nécessaire
        if (newAdsCount > adsCount + 2 || newRevenueCount > revenueCount + 1) {
          setAdsCount(newAdsCount);
          setRevenueCount(newRevenueCount);
          
          // Transition visuelle progressive
          setDisplayedAdsCount(prev => Math.max(prev + Math.floor(Math.random() * 3) + 1, newAdsCount));
          setDisplayedRevenueCount(prev => Math.max(prev + Math.random() * 0.5 + 0.2, newRevenueCount));
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [countersInitialized, adsCount, revenueCount, MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT]);

  return useMemo(() => ({
    displayedAdsCount: Math.max(MINIMUM_ADS_COUNT, displayedAdsCount),
    displayedRevenueCount: Math.max(MINIMUM_REVENUE_COUNT, displayedRevenueCount)
  }), [displayedAdsCount, displayedRevenueCount, MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT]);
};

export default useStatsCounter;
