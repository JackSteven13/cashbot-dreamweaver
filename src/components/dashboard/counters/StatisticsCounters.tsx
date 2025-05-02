
import React, { useEffect, useState } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useUserSession } from '@/hooks/useUserSession';
import { getGlobalStats } from '@/hooks/stats/utils/revenueCalculator';

const StatisticsCounters: React.FC = () => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  
  const [stats, setStats] = useState({
    adsCount: 0,
    revenueCount: 0
  });
  
  // Charger les statistiques centralisées
  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;
      
      const globalStats = await getGlobalStats();
      setStats(globalStats);
    };
    
    loadStats();
    
    // Actualiser périodiquement
    const refreshInterval = setInterval(async () => {
      if (!userId) return;
      
      const globalStats = await getGlobalStats();
      setStats(globalStats);
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [userId]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="bg-blue-900/10 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 dark:text-blue-300">
          <AnimatedNumber 
            value={userId ? stats.adsCount : 0} 
            duration={300}
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
        </div>
        <p className="text-sm md:text-base mt-2 text-blue-800 dark:text-blue-400">Publicités analysées</p>
      </div>
      <div className="bg-emerald-900/10 dark:bg-emerald-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-900 dark:text-emerald-300">
          <AnimatedNumber 
            value={userId ? stats.revenueCount : 0} 
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
