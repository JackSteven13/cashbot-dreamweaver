
import { useState, useEffect, useMemo, useRef } from 'react';
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
    localStorage.setItem('first_use_date', pastDate.toISOString());
  }
  
  // Calculer le nombre de jours depuis l'installation
  const installDate = new Date(localStorage.getItem('first_use_date') || '');
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - installDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
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
  
  // S'assurer que les valeurs ne diminuent jamais lors du chargement initial
  useEffect(() => {
    // Assurer la cohérence des valeurs au démarrage
    ensureProgressiveValues();
    
    // Puis obtenir les valeurs synchronisées
    const consistentStats = getDateConsistentStats();
    
    // Initialiser avec les valeurs cohérentes
    setAdsCount(consistentStats.adsCount);
    setRevenueCount(consistentStats.revenueCount);
    setDisplayedAdsCount(consistentStats.adsCount);
    setDisplayedRevenueCount(consistentStats.revenueCount);
    
    // Persister ces valeurs pour garantir qu'elles ne diminuent jamais
    saveValues(consistentStats.adsCount, consistentStats.revenueCount, false);
    
    console.log('Compteurs initialisés avec des valeurs cohérentes et progressives:', consistentStats);
    
    // Ajouter un écouteur d'événement pour la visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Quand la page redevient visible, s'assurer que les valeurs sont bien synchronisées
        ensureProgressiveValues();
        const refreshedStats = getDateConsistentStats();
        
        setAdsCount(refreshedStats.adsCount);
        setRevenueCount(refreshedStats.revenueCount);
        setDisplayedAdsCount(refreshedStats.adsCount);
        setDisplayedRevenueCount(refreshedStats.revenueCount);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Effet de nettoyage
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Effet pour l'incrémentation périodique avec progression lente mais stable
  useEffect(() => {
    // Première incrémentation après un court délai
    const initialTimeout = setTimeout(() => {
      const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
      
      setAdsCount(newAdsCount);
      setRevenueCount(newRevenueCount);
      setDisplayedAdsCount(newAdsCount);
      setDisplayedRevenueCount(newRevenueCount);
      
      stableValuesRef.current.lastAutoIncrementTime = Date.now();
    }, 5000);
    
    // Ensuite, incrémenter régulièrement mais moins fréquemment
    const incrementInterval = setInterval(() => {
      const now = Date.now();
      
      // Limiter la fréquence des incrémentations
      if (now - stableValuesRef.current.lastAutoIncrementTime > 120000) { // 2 minutes minimum
        stableValuesRef.current.lastAutoIncrementTime = now;
        
        const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
        
        setAdsCount(newAdsCount);
        setRevenueCount(newRevenueCount);
        
        // Animation douce vers les nouvelles valeurs
        animateCounters(newAdsCount, newRevenueCount);
        
        // Sauvegarder pour assurer la persistance
        localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
        localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
      }
    }, 120000); // Toutes les 2 minutes (moins fréquent que précédemment)
    
    // Effet de nettoyage
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(incrementInterval);
    };
  }, [animateCounters, setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Protection supplémentaire pour éviter les baisses de valeurs lors des rerendus
  useEffect(() => {
    // Sauvegarder les valeurs actuelles avant la fermeture ou le rafraîchissement
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
