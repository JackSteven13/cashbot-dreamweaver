
import React, { useEffect } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';

const StatisticsCounters: React.FC = () => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  
  const { adsCount, revenueCount, incrementStats } = usePersistentStats({
    autoIncrement: true,
    userId
  });

  // Incrémenter automatiquement les compteurs à intervalles réguliers
  useEffect(() => {
    const minorUpdateInterval = setInterval(() => {
      // Petits incréments fréquents
      const smallAdsIncrement = Math.floor(Math.random() * 8) + 3;
      const smallRevenueIncrement = Math.floor(Math.random() * 5) + 2;
      
      incrementStats(smallAdsIncrement, smallRevenueIncrement);
    }, 15000); // Toutes les 15 secondes
    
    const majorUpdateInterval = setInterval(() => {
      // Incréments plus importants moins fréquents
      const largerAdsIncrement = Math.floor(Math.random() * 50) + 20;
      const largerRevenueIncrement = Math.floor(Math.random() * 40) + 15;
      
      incrementStats(largerAdsIncrement, largerRevenueIncrement);
    }, 120000); // Toutes les 2 minutes

    return () => {
      clearInterval(minorUpdateInterval);
      clearInterval(majorUpdateInterval);
    };
  }, [incrementStats]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="bg-blue-900/10 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 dark:text-blue-300">
          <AnimatedNumber 
            value={adsCount} 
            duration={1500} 
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
        </div>
        <p className="text-sm md:text-base mt-2 text-blue-800 dark:text-blue-400">Publicités analysées</p>
      </div>

      <div className="bg-emerald-900/10 dark:bg-emerald-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-900 dark:text-emerald-300">
          <AnimatedNumber 
            value={revenueCount} 
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
