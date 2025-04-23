
import React, { useEffect, useState, useCallback } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';

const StatisticsCounters: React.FC = () => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  const CORRELATION_RATIO = 0.76203;

  const { adsCount: baseAdsCount, revenueCount: baseRevenueCount, incrementStats } = usePersistentStats({
    autoIncrement: false,
    userId: userId || 'anonymous',
    forceGrowth: true,
    correlationRatio: CORRELATION_RATIO
  });

  // Progression locale ralentie et faiblement "imparfaite"
  const [localAdsCount, setLocalAdsCount] = useState(baseAdsCount);
  const [localRevenueCount, setLocalRevenueCount] = useState(baseRevenueCount);

  useEffect(() => {
    setLocalAdsCount(baseAdsCount);
    setLocalRevenueCount(baseRevenueCount);
  }, [baseAdsCount, baseRevenueCount]);

  useEffect(() => {
    if (!userId) return;
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
          revInc = (Math.random() * 1.7 + 0.25) * (CORRELATION_RATIO + ((Math.random() - 0.5) * 0.032));
        }
        return prevRev + revInc;
      });
    }, 9500 + Math.floor(Math.random() * 5000)); // toutes les 9,5s à 14,5s

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
