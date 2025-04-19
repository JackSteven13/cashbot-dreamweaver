
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
  
  // Synchroniser les incréments avec le feed des publicités
  useEffect(() => {
    if (!countersInitialized) return;
    
    const handleLocationAdded = (event: Event) => {
      // Eviter les mises à jour trop fréquentes
      const now = Date.now();
      if (now - stableValuesRef.current.lastLocationUpdateTime < 5000) {
        return;
      }
      stableValuesRef.current.lastLocationUpdateTime = now;
      
      // Incrémenter les compteurs de manière cohérente avec le feed
      // en utilisant un délai pour simuler l'analyse
      setTimeout(() => {
        // Incrémenter uniquement d'une vidéo
        const newAdsCount = adsCount + 1;
        setAdsCount(newAdsCount);
        
        // Gain par vidéo réaliste (0.25€-0.80€)
        const adValue = 0.25 + Math.random() * 0.55;
        const newRevenueCount = revenueCount + adValue;
        setRevenueCount(newRevenueCount);
        
        // Sauvegarder les valeurs
        saveValues(newAdsCount, newRevenueCount);
        
        // Déclencher un événement pour que l'animation des compteurs soit synchronisée
        window.dispatchEvent(new CustomEvent('stats:update'));
      }, 800 + Math.random() * 1200); // Délai entre 0.8 et 2 secondes
    };
    
    window.addEventListener('location:added', handleLocationAdded);
    return () => window.removeEventListener('location:added', handleLocationAdded);
  }, [countersInitialized, adsCount, revenueCount]);
  
  // Traitement d'incrémentation automatique extrêmement ralenti
  useEffect(() => {
    if (!countersInitialized) return;
    
    // Vérifie si l'auto-incrément est activé (par défaut: oui)
    const isAutoIncrementEnabled = localStorage.getItem(STORAGE_KEYS.STATS_AUTO_INCREMENT) !== 'false';
    
    if (!isAutoIncrementEnabled) {
      console.log("Auto-increment des statistiques désactivé");
      return;
    }
    
    // Pour garantir que les statistiques évoluent toujours, mais très lentement
    // avec des intervalles extrêmement longs (3-5 minutes)
    const autoIncrement = setInterval(() => {
      // Éviter les mises à jour simultanées
      if (stableValuesRef.current.syncInProgress) return;
      stableValuesRef.current.syncInProgress = true;
      
      const now = Date.now();
      const timeSinceLastIncrement = now - stableValuesRef.current.lastAutoIncrementTime;
      
      // Incrémenter très rarement, avec une progression extrêmement lente
      if (timeSinceLastIncrement > 180000) { // Au moins 3 minutes entre les incréments
        stableValuesRef.current.lastAutoIncrementTime = now;
        
        // Seulement 1 vidéo maximum avec probabilité réduite
        if (Math.random() > 0.7) { // 30% de chance seulement
          const incrementedValues = {
            newAdsCount: adsCount + 1,
            newRevenueCount: revenueCount + (Math.random() * 0.5 + 0.2) // 0.2-0.7€
          };
          
          // Mettre à jour les compteurs avec les nouvelles valeurs
          setAdsCount(incrementedValues.newAdsCount);
          setRevenueCount(incrementedValues.newRevenueCount);
          
          // Simuler une nouvelle entrée dans le feed des publicités
          window.dispatchEvent(new CustomEvent('location:added'));
          
          // Sauvegarder les valeurs pour la persistance
          saveValues(incrementedValues.newAdsCount, incrementedValues.newRevenueCount);
        }
      }
      
      stableValuesRef.current.syncInProgress = false;
    }, 180000 + Math.floor(Math.random() * 120000)); // Entre 3 et 5 minutes
    
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
  
  // Animation et mises à jour périodiques, mais extrêmement ralenties
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
    
    // Interval for very slow periodic counter updates
    // Extrêmement ralenti (10-15 minutes)
    const updateInterval = setInterval(() => {
      // Éviter les mises à jour simultanées
      if (stableValuesRef.current.syncInProgress) return;
      stableValuesRef.current.syncInProgress = true;
      
      // Probabilité très faible d'incrément (20% de chance seulement)
      if (Math.random() > 0.8) {
        // Incrémenter avec des valeurs minimales (1 vidéo uniquement)
        const increment = {
          ads: 1,
          revenue: (Math.random() * 0.5 + 0.2) // 0.2-0.7€
        };
        
        setAdsCount(prev => prev + increment.ads);
        setRevenueCount(prev => prev + increment.revenue);
        
        // Simuler une nouvelle entrée dans le feed
        window.dispatchEvent(new CustomEvent('location:added'));
        
        // Sauvegarder pour la persistance
        saveValues(adsCount + increment.ads, revenueCount + increment.revenue);
      }
      
      stableValuesRef.current.syncInProgress = false;
    }, 600000 + Math.floor(Math.random() * 300000)); // 10-15 minutes
    
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
            return prev + Math.min(1, Math.max(0, Math.floor(diff * 0.01)));
          });
          
          setDisplayedRevenueCount(prev => {
            const diff = newRevenueCount - prev;
            // Limiter à des très petits incréments
            return prev + Math.min(0.1, Math.max(0, diff * 0.01));
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
