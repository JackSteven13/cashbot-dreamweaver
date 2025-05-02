
import React, { useEffect, useState } from 'react';
import StatPanel from './StatPanel';
import { formatRevenue } from '@/utils/formatters';
import { getGlobalStats } from '@/hooks/stats/utils/revenueCalculator';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 4723,
  dailyRevenueTarget = 3819
}: StatsCounterProps) => {
  const [displayValues, setDisplayValues] = useState({
    adsCount: 46800,
    revenueCount: 35665.4
  });

  // Charger les statistiques globales au démarrage
  useEffect(() => {
    const loadGlobalStats = async () => {
      const stats = await getGlobalStats();
      setDisplayValues(stats);
    };
    
    loadGlobalStats();
    
    // Mettre à jour les statistiques périodiquement mais pas trop fréquemment
    // pour donner l'impression de changements naturels
    const updateInterval = setInterval(async () => {
      const stats = await getGlobalStats();
      
      // Animation fluide des valeurs
      setDisplayValues(prevValues => {
        // Calculer une petite partie de la différence pour une transition plus douce
        const diffAds = stats.adsCount - prevValues.adsCount;
        const diffRevenue = stats.revenueCount - prevValues.revenueCount;
        
        return {
          adsCount: prevValues.adsCount + Math.ceil(diffAds * 0.2),
          revenueCount: prevValues.revenueCount + (diffRevenue * 0.2)
        };
      });
    }, 15000);
    
    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  const formatAdsDisplay = (value: number) => {
    const baseFormatted = Math.floor(value).toLocaleString('fr-FR');
    return baseFormatted;
  };
  
  const formatRevenueDisplay = (value: number) => {
    return formatRevenue(value);
  };

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mb-4 md:mb-6">
      <StatPanel 
        value={formatAdsDisplay(displayValues.adsCount)}
        label="Publicités analysées"
        className="text-sm animate-pulse-slow" 
      />
      <StatPanel 
        value={formatRevenueDisplay(displayValues.revenueCount)}
        label="Revenus générés"
        className="text-sm animate-pulse-slow" 
      />
    </div>
  );
};

export default StatsCounter;
