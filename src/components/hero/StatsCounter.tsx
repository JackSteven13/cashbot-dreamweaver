
import React, { useEffect } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 850000,
  dailyRevenueTarget = 1750000
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });

  // Force une mise à jour des compteurs toutes les 5 secondes
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Forcer une mise à jour par changement d'état local
      const event = new CustomEvent('stats:update');
      window.dispatchEvent(event);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mb-4 md:mb-6">
      <StatPanel 
        value={displayedAdsCount.toLocaleString('fr-FR')}
        label="Publicités analysées"
        className="text-sm animate-pulse-slow" 
      />
      <StatPanel 
        value={formatRevenue(displayedRevenueCount)}
        label="Revenus générés"
        className="text-sm animate-pulse-slow"
      />
    </div>
  );
};

export default StatsCounter;
