
import React, { useEffect, useState } from 'react';
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
    correlationRatio: 0.78
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

  useEffect(() => {
    if (!userId) return;
    
    // Incréments micro plus fréquents et plus élevés
    const microUpdateInterval = setInterval(() => {
      const microAdsIncrement = Math.floor(Math.random() * 14) + 8; // 8-21 ads
      const correlationFactor = 0.75 * (0.95 + Math.random() * 0.12);
      const microRevenueIncrement = microAdsIncrement * correlationFactor;
      
      setLocalAdsCount(prev => prev + microAdsIncrement);
      setLocalRevenueCount(prev => prev + microRevenueIncrement);
    }, 2000); // toutes les 2 secondes
    
    // Incréments persistants plus élevés/fréquents
    const minorUpdateInterval = setInterval(() => {
      const smallAdsIncrement = Math.floor(Math.random() * 32) + 15; // 15-46 ads
      const correlationFactor = 0.76 * (0.96 + Math.random() * 0.08);
      const smallRevenueIncrement = smallAdsIncrement * correlationFactor;
      
      if (userId) {
        incrementStats(smallAdsIncrement, smallRevenueIncrement);
      }
    }, 9000); // toutes les 9 secondes
    
    // Incréments majeurs plus rapprochés
    const majorUpdateInterval = setInterval(() => {
      const largerAdsIncrement = Math.floor(Math.random() * 110) + 65; // 65-175 ads
      const correlationFactor = 0.79 * (0.98 + Math.random() * 0.06);
      const largerRevenueIncrement = largerAdsIncrement * correlationFactor;
      
      if (userId) {
        incrementStats(largerAdsIncrement, largerRevenueIncrement);
      }
    }, 45000); // toutes les 45 secondes

    return () => {
      clearInterval(microUpdateInterval);
      clearInterval(minorUpdateInterval);
      clearInterval(majorUpdateInterval);
    };
  }, [incrementStats, userId]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="bg-blue-900/10 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 dark:text-blue-300">
          <AnimatedNumber 
            value={userId ? localAdsCount : 0} 
            duration={1500} 
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
        </div>
        <p className="text-sm md:text-base mt-2 text-blue-800 dark:text-blue-400">Publicités analysées</p>
      </div>

      <div className="bg-emerald-900/10 dark:bg-emerald-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-900 dark:text-emerald-300">
          <AnimatedNumber 
            value={userId ? localRevenueCount : 0} 
            duration={1500} 
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
