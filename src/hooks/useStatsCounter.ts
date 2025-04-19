
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
  
  // Traitement d'incrémentation automatique renforcé
  useEffect(() => {
    if (!countersInitialized) return;
    
    // Vérifie si l'auto-incrément est activé (par défaut: oui)
    const isAutoIncrementEnabled = localStorage.getItem(STORAGE_KEYS.STATS_AUTO_INCREMENT) !== 'false';
    
    if (!isAutoIncrementEnabled) {
      console.log("Auto-increment des statistiques désactivé");
      return;
    }
    
    // Pour garantir que les statistiques évoluent toujours, même sans interaction
    const autoIncrement = setInterval(() => {
      // Éviter les mises à jour simultanées
      if (stableValuesRef.current.syncInProgress) return;
      stableValuesRef.current.syncInProgress = true;
      
      const now = Date.now();
      const timeSinceLastIncrement = now - stableValuesRef.current.lastAutoIncrementTime;
      
      // Incrémenter périodiquement, avec une progression plus importante si longtemps inactif
      if (timeSinceLastIncrement > 20000) { // 20 secondes
        stableValuesRef.current.lastAutoIncrementTime = now;
        
        // Incrémenter avec des pas plus significatifs
        const incrementFactor = Math.min(3, Math.floor(timeSinceLastIncrement / 30000) + 1);
        const incrementedValues = {
          newAdsCount: adsCount + (Math.floor(Math.random() * 50) + 35) * incrementFactor,
          newRevenueCount: revenueCount + (Math.random() * 4 + 3) * incrementFactor
        };
        
        // Mettre à jour les compteurs avec les nouvelles valeurs
        setAdsCount(incrementedValues.newAdsCount);
        setRevenueCount(incrementedValues.newRevenueCount);
        
        // Mettre à jour aussi les valeurs affichées pour une transition visuelle
        const adsStep = (incrementedValues.newAdsCount - displayedAdsCount) * 0.3;
        const revenueStep = (incrementedValues.newRevenueCount - displayedRevenueCount) * 0.3;
        
        setDisplayedAdsCount(prev => prev + Math.ceil(adsStep));
        setDisplayedRevenueCount(prev => prev + revenueStep);
        
        // Sauvegarder les valeurs pour la persistance
        saveValues(incrementedValues.newAdsCount, incrementedValues.newRevenueCount);
      }
      
      stableValuesRef.current.syncInProgress = false;
    }, 20000); // Vérifier toutes les 20 secondes
    
    return () => clearInterval(autoIncrement);
  }, [countersInitialized, adsCount, revenueCount, displayedAdsCount, displayedRevenueCount]);

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
  
  // Animation et mises à jour périodiques
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
    const updateInterval = setInterval(() => {
      // Éviter les mises à jour simultanées
      if (stableValuesRef.current.syncInProgress) return;
      stableValuesRef.current.syncInProgress = true;
      
      // Incrémenter avec des valeurs dans une plage raisonnable
      const increment = {
        ads: Math.floor(Math.random() * 40) + 30, // 30-70
        revenue: (Math.random() * 5) + 2 // 2-7€
      };
      
      setAdsCount(prev => prev + increment.ads);
      setRevenueCount(prev => prev + increment.revenue);
      
      // Sauvegarder pour la persistance
      saveValues(adsCount + increment.ads, revenueCount + increment.revenue);
      
      stableValuesRef.current.syncInProgress = false;
    }, 60000 + Math.floor(Math.random() * 15000)); // Environ toutes les minutes avec variation
    
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
          
          // Assurer une transition visuelle
          setDisplayedAdsCount(prev => {
            const diff = newAdsCount - prev;
            return prev + Math.max(1, Math.floor(diff * 0.1));
          });
          
          setDisplayedRevenueCount(prev => {
            const diff = newRevenueCount - prev;
            return prev + Math.max(0.01, diff * 0.1);
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
