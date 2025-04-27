
import React, { useEffect, useState, useCallback } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';

const StatisticsCounters: React.FC = () => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  const CORRELATION_RATIO = 0.76203;

  // Utiliser l'ID utilisateur pour isoler les statistiques
  const { adsCount: baseAdsCount, revenueCount: baseRevenueCount } = usePersistentStats({
    autoIncrement: false,
    userId: userId || 'anonymous', // Utiliser l'ID de l'utilisateur comme clé
    forceGrowth: true,
    correlationRatio: CORRELATION_RATIO
  });

  // Progression locale ralentie et faiblement "imparfaite"
  const [localAdsCount, setLocalAdsCount] = useState(baseAdsCount);
  const [localRevenueCount, setLocalRevenueCount] = useState(baseRevenueCount);

  // Synchroniser avec les valeurs de base lorsqu'elles changent
  useEffect(() => {
    if (userId) {
      console.log(`StatisticsCounters: Synchronisation avec userId=${userId}, ads=${baseAdsCount}, revenue=${baseRevenueCount}`);
      setLocalAdsCount(baseAdsCount);
      setLocalRevenueCount(baseRevenueCount);
    }
  }, [baseAdsCount, baseRevenueCount, userId]);

  // Progression locale différenciée par utilisateur
  useEffect(() => {
    if (!userId) return;
    
    // Utiliser un intervalle unique pour chaque utilisateur
    const userSpecificRate = userId ? 
      (userId.charCodeAt(0) % 5 + 8) * 1000 : // Entre 8 et 12 secondes, selon l'ID utilisateur
      9500;
    
    const updateInterval = setInterval(() => {
      setLocalAdsCount(prev => {
        let adsIncrement = 0;
        const adsRand = Math.random();
        if (adsRand > 0.92) adsIncrement = 2;
        else if (adsRand > 0.70) adsIncrement = 1;
        return prev + adsIncrement;
      });
      
      setLocalRevenueCount(prevRev => {
        let revInc = 0;
        if (Math.random() > 0.82) {
          // Variation légère basée sur l'ID utilisateur pour que chaque utilisateur ait un pattern différent
          const userVariation = userId ? (userId.charCodeAt(0) % 10) / 100 : 0;
          revInc = (Math.random() * 1.7 + 0.25) * (CORRELATION_RATIO + ((Math.random() - 0.5) * 0.032) + userVariation);
        }
        return prevRev + revInc;
      });
    }, userSpecificRate + Math.floor(Math.random() * 5000));

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
