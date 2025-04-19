
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
  
  // Initialisation cohérente avec les valeurs minimales
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
  
  // Synchroniser les incréments STRICTEMENT avec le feed des publicités
  useEffect(() => {
    if (!countersInitialized) return;
    
    const handleLocationAdded = (event: Event) => {
      // Limiter strictement les mises à jour (30 seconds minimum entre chaque)
      const now = Date.now();
      if (now - stableValuesRef.current.lastLocationUpdateTime < 30000) {
        console.log("Mise à jour de stats bloquée - trop rapprochée");
        return;
      }
      stableValuesRef.current.lastLocationUpdateTime = now;
      
      // Incrémenter après un délai pour simuler l'analyse
      setTimeout(() => {
        // Incrémenter TOUJOURS d'UNE SEULE vidéo
        const newAdsCount = adsCount + 1;
        setAdsCount(newAdsCount);
        
        // Gain très faible par vidéo (0.2€-0.4€)
        const adValue = 0.2 + Math.random() * 0.2;
        const newRevenueCount = revenueCount + adValue;
        setRevenueCount(newRevenueCount);
        
        // Sauvegarder les valeurs
        saveValues(newAdsCount, newRevenueCount);
      }, 3000 + Math.random() * 2000); // Délai entre 3 et 5 secondes
    };
    
    window.addEventListener('location:added', handleLocationAdded);
    return () => window.removeEventListener('location:added', handleLocationAdded);
  }, [countersInitialized, adsCount, revenueCount]);
  
  // Auto-incrémentation EXTRÊMEMENT ralentie
  useEffect(() => {
    if (!countersInitialized) return;
    
    // Vérifie si l'auto-incrément est activé (par défaut: oui)
    const isAutoIncrementEnabled = localStorage.getItem(STORAGE_KEYS.STATS_AUTO_INCREMENT) !== 'false';
    
    if (!isAutoIncrementEnabled) {
      console.log("Auto-increment des statistiques désactivé");
      return;
    }
    
    // Progression glaciale avec des intervalles extrêmement longs (10-20 minutes)
    const autoIncrement = setInterval(() => {
      // Éviter les mises à jour simultanées
      if (stableValuesRef.current.syncInProgress) return;
      stableValuesRef.current.syncInProgress = true;
      
      const now = Date.now();
      const timeSinceLastIncrement = now - stableValuesRef.current.lastAutoIncrementTime;
      
      // Incrémenter très rarement
      if (timeSinceLastIncrement > 600000) { // Au moins 10 minutes entre les incréments
        stableValuesRef.current.lastAutoIncrementTime = now;
        
        // Probabilité encore plus faible (10% de chance)
        if (Math.random() > 0.9) { 
          // Toujours une seule vidéo
          const incrementedValues = {
            newAdsCount: adsCount + 1,
            newRevenueCount: revenueCount + (Math.random() * 0.2 + 0.2) // 0.2-0.4€
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
    }, 600000 + Math.floor(Math.random() * 600000)); // Entre 10 et 20 minutes
    
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
  
  // Animation et mises à jour périodiques ultra-ralenties
  useEffect(() => {
    if (!countersInitialized) return;
    
    // Animation frame rate extrêmement réduit
    let animationFrameId: number;
    let lastFrameTime = 0;
    
    const updateAnimation = (timestamp: number) => {
      // Limiter le framerate à 1 frame par seconde maximum
      if (timestamp - lastFrameTime > 1000) {
        lastFrameTime = timestamp;
        animateCounters();
      }
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    // Start animation avec framerate réduit
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Mises à jour périodiques extrêmement espacées (30-40 minutes)
    const updateInterval = setInterval(() => {
      // Éviter les mises à jour simultanées
      if (stableValuesRef.current.syncInProgress) return;
      stableValuesRef.current.syncInProgress = true;
      
      // Probabilité infime d'incrément (5% de chance)
      if (Math.random() > 0.95) {
        // Toujours une seule vidéo
        const increment = {
          ads: 1,
          revenue: (Math.random() * 0.2 + 0.2) // 0.2-0.4€
        };
        
        setAdsCount(prev => prev + increment.ads);
        setRevenueCount(prev => prev + increment.revenue);
        
        // Simuler une nouvelle entrée dans le feed
        window.dispatchEvent(new CustomEvent('location:added'));
        
        // Sauvegarder
        saveValues(adsCount + increment.ads, revenueCount + increment.revenue);
      }
      
      stableValuesRef.current.syncInProgress = false;
    }, 1800000 + Math.floor(Math.random() * 600000)); // 30-40 minutes
    
    // Reset at midnight
    const resetTimeout = scheduleCycleUpdate();
    
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      clearInterval(updateInterval);
    };
  }, [animateCounters, incrementCountersRandomly, scheduleCycleUpdate, countersInitialized]);

  // Synchroniser avec visibilitychange pour progression minime
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && countersInitialized) {
        // Récupérer les valeurs stockées
        const consistentStats = getDateConsistentStats();
        
        // Utiliser les valeurs les plus élevées
        const newAdsCount = Math.max(adsCount, consistentStats.adsCount);
        const newRevenueCount = Math.max(revenueCount, consistentStats.revenueCount);
        
        // Mettre à jour si nécessaire, mais avec une différence significative uniquement
        if (newAdsCount > adsCount + 5 || newRevenueCount > revenueCount + 2) {
          setAdsCount(newAdsCount);
          setRevenueCount(newRevenueCount);
          
          // Transition visuelle ultra-lente
          setDisplayedAdsCount(prev => {
            // Limiter à +1 maximum
            return prev + 1;
          });
          
          setDisplayedRevenueCount(prev => {
            // Limiter à un très petit incrément
            return prev + 0.2;
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
