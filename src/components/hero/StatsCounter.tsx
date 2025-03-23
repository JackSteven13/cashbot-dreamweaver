
import React from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 42500, // Réduit à un chiffre plus crédible
  dailyRevenueTarget = 175000 // Réduit proportionnellement
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full max-w-lg mb-6 md:mb-8 animate-slide-up">
      <StatPanel 
        value={displayedAdsCount.toLocaleString('fr-FR')}
        label="Publicités analysées"
      />
      <StatPanel 
        value={formatRevenue(displayedRevenueCount)}
        label="Revenus générés"
      />
    </div>
  );
};

export default StatsCounter;
