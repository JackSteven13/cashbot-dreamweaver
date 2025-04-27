
import { useState, useEffect, useRef } from 'react';
import { MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT } from './utils/valueInitializer';
import { getDateConsistentStats, ensureProgressiveValues } from './utils/valueSynchronizer';

interface UsePersistentStatsParams {
  autoIncrement?: boolean;
  userId?: string;
  forceGrowth?: boolean;
  correlationRatio?: number;
}

interface StatsValues {
  adsCount: number;
  revenueCount: number;
}

export const usePersistentStats = ({
  autoIncrement = true,
  userId = 'global',
  forceGrowth = false,
  correlationRatio = 0.76203
}: UsePersistentStatsParams = {}): StatsValues => {
  // Utiliser des références pour éviter les rendus inutiles
  const statsRef = useRef<StatsValues>({
    adsCount: MINIMUM_ADS_COUNT,
    revenueCount: MINIMUM_REVENUE_COUNT
  });
  
  // Initialiser l'état avec les valeurs stockées
  const [stats, setStats] = useState<StatsValues>(() => {
    // Forcer la progression des valeurs si nécessaire
    const initialStats = forceGrowth 
      ? ensureProgressiveValues() 
      : getDateConsistentStats();
    
    // Mettre à jour la référence
    statsRef.current = initialStats;
    
    return initialStats;
  });
  
  // Mettre à jour les statistiques à partir des événements du DOM
  useEffect(() => {
    // Fonction pour mettre à jour les statistiques
    const handleStatsUpdate = (event: CustomEvent) => {
      if (event.detail && typeof event.detail === 'object') {
        // Mettre à jour l'état avec les nouvelles valeurs
        setStats(prevStats => {
          const newStats = {
            ...prevStats,
            adsCount: event.detail.adsCount ?? prevStats.adsCount,
            revenueCount: event.detail.revenueCount ?? prevStats.revenueCount
          };
          
          // Mettre à jour la référence
          statsRef.current = newStats;
          
          return newStats;
        });
      }
    };
    
    // Écouter les événements de mise à jour des statistiques
    window.addEventListener('stats:update', handleStatsUpdate as EventListener);
    window.addEventListener('stats:sync', handleStatsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('stats:update', handleStatsUpdate as EventListener);
      window.removeEventListener('stats:sync', handleStatsUpdate as EventListener);
    };
  }, []);
  
  return stats;
};

export default usePersistentStats;
