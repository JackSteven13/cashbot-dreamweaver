
import React, { useEffect, useState, useCallback } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';

const StatisticsCounters: React.FC = () => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  
  // Utiliser un ratio fixe pour la synchronisation parfaite
  const CORRELATION_RATIO = 0.76203;
  
  const { adsCount, revenueCount, incrementStats } = usePersistentStats({
    autoIncrement: true,
    userId: userId || 'anonymous',
    forceGrowth: true,
    correlationRatio: CORRELATION_RATIO // Parfaite synchronisation avec StatisticsDisplay
  });
  
  const [localAdsCount, setLocalAdsCount] = useState(0);
  const [localRevenueCount, setLocalRevenueCount] = useState(0);
  
  // Effet initial pour charger les stats
  useEffect(() => {
    if (userId && adsCount > 0) {
      setLocalAdsCount(adsCount);
      // Forcer la corrélation parfaite
      setLocalRevenueCount(adsCount * CORRELATION_RATIO);
    }
  }, [adsCount, userId, CORRELATION_RATIO]);

  // Fonction de mise à jour synchronisée avec corrélation parfaite
  const updateBothCounters = useCallback((adsIncrement: number, forceSync = false) => {
    // Garantir une parfaite corrélation entre publicités et revenus
    const newAdsCount = localAdsCount + adsIncrement;
    const newRevenueCount = newAdsCount * CORRELATION_RATIO;

    setLocalAdsCount(newAdsCount);
    setLocalRevenueCount(newRevenueCount);
    
    // Synchroniser avec les stats persistantes
    if (forceSync) {
      incrementStats(adsIncrement);
    }
  }, [localAdsCount, incrementStats, CORRELATION_RATIO]);

  // Écoute des événements et incréments réguliers
  useEffect(() => {
    if (!userId) return;
    
    // Écouter les événements de synchronisation externes
    const handleStatsUpdate = (event: CustomEvent) => {
      if (event.detail) {
        const { adsCount: syncedAdsCount } = event.detail;
        
        // S'assurer que les valeurs ne diminuent jamais
        if (syncedAdsCount > localAdsCount) {
          setLocalAdsCount(syncedAdsCount);
          // Calculer les revenus pour une synchronisation parfaite
          setLocalRevenueCount(syncedAdsCount * CORRELATION_RATIO);
        }
      }
    };
    
    window.addEventListener('stats:counters:updated', handleStatsUpdate as EventListener);
    window.addEventListener('stats:sync', handleStatsUpdate as EventListener);
    window.addEventListener('stats:update', handleStatsUpdate as EventListener);
    
    // Micro-incréments très fréquents et parfaitement corrélés
    const microUpdateInterval = setInterval(() => {
      const microAdsIncrement = Math.floor(Math.random() * 3) + 1; // 1-3 ads
      updateBothCounters(microAdsIncrement);
    }, 1000); // Chaque seconde
    
    // Incréments persistants
    const minorUpdateInterval = setInterval(() => {
      const smallAdsIncrement = Math.floor(Math.random() * 5) + 3; // 3-7 ads
      updateBothCounters(smallAdsIncrement, true);
      
      // Synchroniser avec d'autres composants
      window.dispatchEvent(new CustomEvent('stats:counters:updated', {
        detail: { 
          adsCount: localAdsCount + smallAdsIncrement,
          revenueCount: (localAdsCount + smallAdsIncrement) * CORRELATION_RATIO
        }
      }));
    }, 3000); // Toutes les 3 secondes

    return () => {
      window.removeEventListener('stats:counters:updated', handleStatsUpdate as EventListener);
      window.removeEventListener('stats:sync', handleStatsUpdate as EventListener);
      window.removeEventListener('stats:update', handleStatsUpdate as EventListener);
      clearInterval(microUpdateInterval);
      clearInterval(minorUpdateInterval);
    };
  }, [userId, localAdsCount, updateBothCounters, CORRELATION_RATIO]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="bg-blue-900/10 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 dark:text-blue-300">
          <AnimatedNumber 
            value={userId ? localAdsCount : 0} 
            duration={300} // Animation plus rapide 
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
        </div>
        <p className="text-sm md:text-base mt-2 text-blue-800 dark:text-blue-400">Publicités analysées</p>
      </div>

      <div className="bg-emerald-900/10 dark:bg-emerald-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-900 dark:text-emerald-300">
          <AnimatedNumber 
            value={userId ? localRevenueCount : 0} 
            duration={300} // Animation plus rapide
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
          <span className="ml-1">€</span>
        </div>
        <p className="text-sm md:text-base mt-2 text-emerald-800 dark:text-emerald-400">Revenus générés</p>
      </div>
    </div>
  );
};

export default StatisticsCounters;
