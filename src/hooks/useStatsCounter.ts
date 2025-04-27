
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
  // Récupérer les valeurs minimales dynamiques
  const minimumValues = useMemo(() => getMinimumValues(), []);
  const { ADS_COUNT: MINIMUM_ADS_COUNT, REVENUE_COUNT: MINIMUM_REVENUE_COUNT } = minimumValues;
  
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

  // Utiliser useState avec fonction d'initialisation pour éviter les re-rendus inutiles
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
  
  // Track initial load state with useRef to avoid re-renders
  const isFirstLoadRef = useRef(true);
  const countersInitializedRef = useRef(false);
  
  // Animation function with useCallback to avoid re-creation
  const animateCounters = useCallback((targetAdsCount: number, targetRevenueCount: number) => {
    setDisplayedAdsCount(targetAdsCount);
    setDisplayedRevenueCount(targetRevenueCount);
  }, []);
  
  // Initialiser les compteurs une seule fois
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      
      // S'assurer que les valeurs ne diminuent jamais lors du chargement initial
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
      
      countersInitializedRef.current = true;
    }
  }, []);
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && countersInitializedRef.current) {
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
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Incrementation logic - throttled
  useEffect(() => {
    if (!countersInitializedRef.current) return;
    
    // Première incrémentation après un délai plus long
    const initialTimeout = setTimeout(() => {
      const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
      
      setAdsCount(newAdsCount);
      setRevenueCount(newRevenueCount);
      setDisplayedAdsCount(newAdsCount);
      setDisplayedRevenueCount(newRevenueCount);
      
      stableValuesRef.current.lastAutoIncrementTime = Date.now();
    }, 30000); // Attendre 30 secondes avant la première mise à jour
    
    // Ensuite, incrémenter beaucoup moins fréquemment (5 minutes minimum)
    const incrementInterval = setInterval(() => {
      const now = Date.now();
      
      // Limiter fortement la fréquence des incrémentations
      if (now - stableValuesRef.current.lastAutoIncrementTime > 300000) { // 5 minutes minimum
        // Ajouter une probabilité pour que l'incrémentation ne se produise pas à chaque intervalle
        if (Math.random() > 0.4) { // 60% de chance d'incrémenter
          stableValuesRef.current.lastAutoIncrementTime = now;
          
          // Ajuster les valeurs d'incrémentation pour qu'elles soient très faibles
          const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
          
          setAdsCount(newAdsCount);
          setRevenueCount(newRevenueCount);
          
          // Animation douce vers les nouvelles valeurs
          animateCounters(newAdsCount, newRevenueCount);
          
          // Sauvegarder pour assurer la persistance
          try {
            localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
            localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
          } catch (e) {
            console.error("Failed to save displayed counts:", e);
          }
        }
      }
    }, 300000); // Vérifier toutes les 5 minutes
    
    // Effet de nettoyage
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(incrementInterval);
    };
  }, [animateCounters]);
  
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
