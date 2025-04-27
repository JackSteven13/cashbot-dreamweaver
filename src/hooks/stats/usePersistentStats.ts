
import { useState, useEffect, useRef } from 'react';

const LOCAL_STORAGE_KEY_PREFIX = 'user_stats_';

interface UsePersistentStatsParams {
  initialAdsCount?: number;
  initialRevenueCount?: number;
  autoIncrement?: boolean;
  userId?: string;
  forceGrowth?: boolean;
  correlationRatio?: number;
}

// Fonction pour obtenir les clés de stockage spécifiques à l'utilisateur
const getUserSpecificKeys = (userId: string) => ({
  adsCount: `${LOCAL_STORAGE_KEY_PREFIX}${userId}_ads_count`,
  revenueCount: `${LOCAL_STORAGE_KEY_PREFIX}${userId}_revenue_count`,
  lastUpdate: `${LOCAL_STORAGE_KEY_PREFIX}${userId}_last_update`,
});

// Fonction pour sauvegarder des statistiques pour un utilisateur spécifique
const saveStats = (userId: string, adsCount: number, revenueCount: number) => {
  if (!userId) return;
  
  // Garantir la synchronisation parfaite entre publicités et revenus
  const PERFECT_CORRELATION_RATIO = 0.76203;
  const calculatedRevenue = adsCount * PERFECT_CORRELATION_RATIO;
  
  // Utiliser la valeur de revenu calculée pour garantir la corrélation
  const finalRevenueCount = calculatedRevenue;
  
  const keys = getUserSpecificKeys(userId);
  try {
    localStorage.setItem(keys.adsCount, adsCount.toString());
    localStorage.setItem(keys.revenueCount, finalRevenueCount.toString());
    localStorage.setItem(keys.lastUpdate, Date.now().toString());
    
    // Enregistrer également les dernières valeurs pour les comparer ultérieurement
    localStorage.setItem(`${keys.adsCount}_last`, adsCount.toString());
    localStorage.setItem(`${keys.revenueCount}_last`, finalRevenueCount.toString());
    
    // Synchroniser les deux compteurs globaux pour tous les composants
    window.dispatchEvent(new CustomEvent('stats:update', {
      detail: { adsCount, revenueCount: finalRevenueCount }
    }));
  } catch (error) {
    console.error('Error saving stats to localStorage:', error);
  }
};

// Fonction pour charger des statistiques pour un utilisateur spécifique
const loadStats = (userId: string): { adsCount: number; revenueCount: number; lastUpdate: number } => {
  if (!userId) {
    return { adsCount: 0, revenueCount: 0, lastUpdate: 0 };
  }

  const keys = getUserSpecificKeys(userId);
  try {
    const adsCount = parseInt(localStorage.getItem(keys.adsCount) || '0', 10);
    const revenueCount = parseFloat(localStorage.getItem(keys.revenueCount) || '0');
    const lastUpdate = parseInt(localStorage.getItem(keys.lastUpdate) || '0', 10);
    
    return { adsCount, revenueCount, lastUpdate };
  } catch (error) {
    console.error('Error loading stats from localStorage:', error);
    return { adsCount: 0, revenueCount: 0, lastUpdate: 0 };
  }
};

export const usePersistentStats = ({
  initialAdsCount = 36742,
  initialRevenueCount = 23918,
  autoIncrement = false,
  userId = '',
  forceGrowth = false,
  correlationRatio = 0.76203
}: UsePersistentStatsParams) => {
  // Utiliser useRef pour stocker les données entre les rendus sans déclencher de re-rendu
  const statsRef = useRef({
    adsCount: initialAdsCount,
    revenueCount: initialRevenueCount
  });
  
  // État pour déclencher les re-rendus lors des mises à jour d'interface
  const [adsCount, setAdsCount] = useState(() => {
    // Si un userId est fourni, charger les statistiques stockées
    if (userId) {
      const savedStats = loadStats(userId);
      if (savedStats.adsCount > 0) {
        statsRef.current.adsCount = savedStats.adsCount;
        return savedStats.adsCount;
      }
    }
    return initialAdsCount;
  });

  const [revenueCount, setRevenueCount] = useState(() => {
    // Si un userId est fourni, charger les statistiques stockées
    if (userId) {
      const savedStats = loadStats(userId);
      if (savedStats.revenueCount > 0) {
        statsRef.current.revenueCount = savedStats.revenueCount;
        return savedStats.revenueCount;
      }
    }
    return initialRevenueCount;
  });
  
  // Sauvegarder les statistiques lorsque les valeurs changent, mais uniquement si un userId est fourni
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstUpdateRef = useRef(true);
  
  useEffect(() => {
    // Éviter la première mise à jour lors du chargement initial
    if (isFirstUpdateRef.current) {
      isFirstUpdateRef.current = false;
      return;
    }
    
    // Ne pas effectuer de mise à jour si aucun userId n'est fourni
    if (!userId) return;
    
    // Stocker les valeurs actuelles dans la référence
    statsRef.current = {
      adsCount,
      revenueCount
    };
    
    // Limiter les mises à jour pour éviter les problèmes de performance
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    // Programmer une mise à jour après un court délai
    updateTimerRef.current = setTimeout(() => {
      saveStats(userId, adsCount, revenueCount);
      updateTimerRef.current = null;
    }, 500);
    
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, [adsCount, revenueCount, userId]);

  // Gérer l'incrément automatique des statistiques
  useEffect(() => {
    if (!autoIncrement) return;
    
    const incrementInterval = setInterval(() => {
      // Utiliser un callback pour éviter d'utiliser l'état précédent directement
      setAdsCount(prev => {
        const newValue = prev + Math.floor(1 + Math.random() * 2);
        statsRef.current.adsCount = newValue;
        return newValue;
      });
      
      setRevenueCount(prev => {
        const increment = (1 + Math.random() * 2) * correlationRatio;
        const newValue = prev + increment;
        statsRef.current.revenueCount = newValue;
        return newValue;
      });
    }, 60000); // Toutes les minutes
    
    return () => clearInterval(incrementInterval);
  }, [autoIncrement, correlationRatio]);

  // Écouter les événements personnalisés pour les mises à jour des statistiques
  useEffect(() => {
    const handleStatsUpdate = (event: CustomEvent) => {
      const { adsCount: newAdsCount, revenueCount: newRevenueCount } = event.detail;
      
      if (newAdsCount !== undefined && newAdsCount !== adsCount) {
        statsRef.current.adsCount = newAdsCount;
        setAdsCount(newAdsCount);
      }
      
      if (newRevenueCount !== undefined && newRevenueCount !== revenueCount) {
        statsRef.current.revenueCount = newRevenueCount;
        setRevenueCount(newRevenueCount);
      }
    };
    
    window.addEventListener('stats:update' as any, handleStatsUpdate);
    
    return () => {
      window.removeEventListener('stats:update' as any, handleStatsUpdate);
    };
  }, []);  // Dependency array intentionally empty - using refs to prevent loops

  // Add the incrementStats function to manually increment stats
  const incrementStats = (adsIncrement = 1, revenueIncrement?: number) => {
    const actualRevenueIncrement = revenueIncrement !== undefined ? 
      revenueIncrement : 
      adsIncrement * correlationRatio;

    setAdsCount(prev => {
      const newValue = prev + adsIncrement;
      statsRef.current.adsCount = newValue;
      return newValue;
    });
    
    setRevenueCount(prev => {
      const newValue = prev + actualRevenueIncrement;
      statsRef.current.revenueCount = newValue;
      return newValue;
    });
    
    // If a userId is provided, save the updated stats
    if (userId) {
      const newAdsCount = statsRef.current.adsCount + adsIncrement;
      const newRevenueCount = statsRef.current.revenueCount + actualRevenueIncrement;
      saveStats(userId, newAdsCount, newRevenueCount);
    }
    
    return {
      newAdsCount: statsRef.current.adsCount + adsIncrement,
      newRevenueCount: statsRef.current.revenueCount + actualRevenueIncrement
    };
  };

  return {
    adsCount,
    revenueCount,
    setAdsCount,
    setRevenueCount,
    incrementStats
  };
};

export default usePersistentStats;
