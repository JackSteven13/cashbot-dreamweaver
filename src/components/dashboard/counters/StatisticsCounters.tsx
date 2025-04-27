
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';
import { synchronizeRevenueWithAds } from '@/hooks/stats/utils/revenueCalculator';

const StatisticsCounters: React.FC = () => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  const CORRELATION_RATIO = 0.76203;

  // Utiliser l'ID utilisateur pour isoler les statistiques
  const { adsCount: baseAdsCount, revenueCount: baseRevenueCount, incrementStats } = usePersistentStats({
    autoIncrement: false,
    userId: userId || 'anonymous', // Utiliser l'ID de l'utilisateur comme clé
    forceGrowth: true,
    correlationRatio: CORRELATION_RATIO
  });

  // Progression locale ralentie et faiblement "imparfaite"
  const [localAdsCount, setLocalAdsCount] = useState(baseAdsCount);
  const [localRevenueCount, setLocalRevenueCount] = useState(baseRevenueCount);

  // Référence pour stocker la dernière mise à jour
  const lastUpdateRef = useRef<number>(Date.now());

  // Synchroniser avec les valeurs de base lorsqu'elles changent
  useEffect(() => {
    if (userId) {
      console.log(`StatisticsCounters: Synchronisation avec userId=${userId}, ads=${baseAdsCount}, revenue=${baseRevenueCount}`);
      setLocalAdsCount(baseAdsCount);
      
      // IMPORTANT: Toujours recalculer les revenus à partir des pubs pour assurer une parfaite cohérence
      const syncedRevenue = synchronizeRevenueWithAds(baseAdsCount);
      setLocalRevenueCount(syncedRevenue);
    }
  }, [baseAdsCount, baseRevenueCount, userId]);

  // Progression locale différenciée par utilisateur
  useEffect(() => {
    if (!userId) return;
    
    // Utiliser un intervalle unique pour chaque utilisateur
    const userSpecificRate = userId ? 
      (userId.charCodeAt(0) % 5 + 5) * 1000 : // Entre 5 et 10 secondes, selon l'ID utilisateur - Plus rapide pour être visible
      7500;
    
    const updateInterval = setInterval(() => {
      // Vérifier si suffisamment de temps s'est écoulé depuis la dernière mise à jour
      const now = Date.now();
      if (now - lastUpdateRef.current < 3000) {
        // Éviter les mises à jour trop fréquentes
        return;
      }
      
      setLocalAdsCount(prev => {
        let adsIncrement = 0;
        const adsRand = Math.random();
        if (adsRand > 0.80) adsIncrement = 2;  // Augmenté la probabilité d'incrément
        else if (adsRand > 0.55) adsIncrement = 1;
        
        const newAdsCount = prev + adsIncrement;
        
        // Si les publicités ont augmenté, mettre à jour aussi les revenus
        if (adsIncrement > 0) {
          // IMPORTANT: Toujours recalculer les revenus avec le ratio parfait
          const newRevenueCount = synchronizeRevenueWithAds(newAdsCount);
          setLocalRevenueCount(newRevenueCount);
          lastUpdateRef.current = now; // Marquer le moment de la mise à jour
        }
        
        return newAdsCount;
      });
    }, userSpecificRate + Math.floor(Math.random() * 3000)); // Variation réduite dans l'intervalle

    return () => clearInterval(updateInterval);
  }, [userId]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="bg-blue-900/10 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 dark:text-blue-300">
          <AnimatedNumber 
            value={userId ? localAdsCount : 0} 
            duration={300}
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
        </div>
        <p className="text-sm md:text-base mt-2 text-blue-800 dark:text-blue-400">Publicités analysées</p>
      </div>
      <div className="bg-emerald-900/10 dark:bg-emerald-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-900 dark:text-emerald-300">
          <AnimatedNumber 
            value={userId ? localRevenueCount : 0} 
            duration={300}
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
