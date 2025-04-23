
import React, { useEffect, useState, useCallback } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';

const StatisticsCounters: React.FC = () => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  
  const { adsCount, revenueCount, incrementStats } = usePersistentStats({
    autoIncrement: true,
    userId: userId || 'anonymous',
    forceGrowth: true,
    correlationRatio: 1.0 // Parfaite synchronisation avec StatisticsDisplay
  });
  
  const [localAdsCount, setLocalAdsCount] = useState(0);
  const [localRevenueCount, setLocalRevenueCount] = useState(0);
  
  useEffect(() => {
    if (userId && adsCount > 0) {
      setLocalAdsCount(adsCount);
    }
    if (userId && revenueCount > 0) {
      setLocalRevenueCount(revenueCount);
    }
  }, [adsCount, revenueCount, userId]);

  // Fonction de mise à jour synchronisée avec corrélation parfaite
  const updateBothCounters = useCallback((adsIncrement: number, forceSync = false) => {
    // Garantir une parfaite corrélation entre publicités et revenus
    const correlationFactor = 1.002; // Facteur fixe pour une synchronisation parfaite
    const revenueIncrement = adsIncrement * correlationFactor;
    
    const newAdsCount = localAdsCount + adsIncrement;
    const newRevenueCount = localRevenueCount + revenueIncrement;

    setLocalAdsCount(newAdsCount);
    setLocalRevenueCount(newRevenueCount);
    
    // Synchroniser avec les stats persistantes
    if (forceSync || Math.random() > 0.3) { // 70% de chance de synchroniser (augmenté)
      incrementStats(adsIncrement, revenueIncrement);
    }
  }, [localAdsCount, localRevenueCount, incrementStats]);

  useEffect(() => {
    if (!userId) return;
    
    // Écouter les événements de synchronisation externes
    const handleStatsUpdate = (event: CustomEvent) => {
      if (event.detail) {
        const { adsCount: syncedAdsCount, revenueCount: syncedRevenueCount } = event.detail;
        
        // S'assurer que les valeurs ne diminuent jamais
        if (syncedAdsCount > localAdsCount) {
          setLocalAdsCount(syncedAdsCount);
        }
        if (syncedRevenueCount > localRevenueCount) {
          setLocalRevenueCount(syncedRevenueCount);
        }
      }
    };
    
    window.addEventListener('stats:counters:updated', handleStatsUpdate as EventListener);
    window.addEventListener('stats:sync', handleStatsUpdate as EventListener);
    window.addEventListener('stats:update', handleStatsUpdate as EventListener);
    
    // Micro-incréments très fréquents et parfaitement corrélés
    const microUpdateInterval = setInterval(() => {
      const microAdsIncrement = Math.floor(Math.random() * 18) + 12; // 12-29 ads
      updateBothCounters(microAdsIncrement);
    }, 250); // Encore plus rapide: 250ms
    
    // Incréments persistants plus élevés/fréquents
    const minorUpdateInterval = setInterval(() => {
      const smallAdsIncrement = Math.floor(Math.random() * 45) + 30; // 30-74 ads
      updateBothCounters(smallAdsIncrement, true);
      
      // Synchroniser avec d'autres composants
      window.dispatchEvent(new CustomEvent('stats:counters:updated', {
        detail: { 
          adsCount: localAdsCount + smallAdsIncrement, 
          revenueCount: localRevenueCount + (smallAdsIncrement * 1.002) // Garantir que les revenus augmentent
        }
      }));
    }, 1200); // Toutes les 1.2 secondes (accéléré)

    return () => {
      window.removeEventListener('stats:counters:updated', handleStatsUpdate as EventListener);
      window.removeEventListener('stats:sync', handleStatsUpdate as EventListener);
      window.removeEventListener('stats:update', handleStatsUpdate as EventListener);
      clearInterval(microUpdateInterval);
      clearInterval(minorUpdateInterval);
    };
  }, [userId, localAdsCount, localRevenueCount, updateBothCounters, incrementStats]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="bg-blue-900/10 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 dark:text-blue-300">
          <AnimatedNumber 
            value={userId ? localAdsCount : 0} 
            duration={500} // Animation plus rapide 
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
        </div>
        <p className="text-sm md:text-base mt-2 text-blue-800 dark:text-blue-400">Publicités analysées</p>
      </div>

      <div className="bg-emerald-900/10 dark:bg-emerald-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-900 dark:text-emerald-300">
          <AnimatedNumber 
            value={userId ? localRevenueCount : 0} 
            duration={500} // Animation plus rapide
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
