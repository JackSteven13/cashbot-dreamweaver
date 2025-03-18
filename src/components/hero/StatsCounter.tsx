
import React from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';
import AnalyticsVisualizer from './AnalyticsVisualizer';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
  visualizerVariant?: 'radar' | 'globe' | 'processor' | 'bars' | 'trend';
  showVisualizer?: boolean;
}

const StatsCounter = ({
  dailyAdsTarget = 750000, // Increased substantially to show much higher processing
  dailyRevenueTarget = 3500000, // Increased to show dramatically more impressive revenue
  visualizerVariant = 'processor',
  showVisualizer = false
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });

  return (
    <div className="flex flex-col items-center w-full">
      {showVisualizer ? (
        <div className="w-full mb-6 md:mb-8 animate-fade-in">
          <AnalyticsVisualizer 
            displayedAdsCount={displayedAdsCount} 
            displayedRevenueCount={displayedRevenueCount}
            variant={visualizerVariant}
          />
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default StatsCounter;
