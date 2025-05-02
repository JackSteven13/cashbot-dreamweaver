
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
    adsCount: 150000,
    revenueCount: 114304.5
  });

  // Charger les statistiques globales au démarrage
  useEffect(() => {
    const loadGlobalStats = async () => {
      const stats = await getGlobalStats();
      setDisplayValues(stats);
    };
    
    loadGlobalStats();
    
    // Mettre à jour les statistiques toutes les 60 secondes
    const updateInterval = setInterval(async () => {
      const stats = await getGlobalStats();
      setDisplayValues(stats);
    }, 60000);
    
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
