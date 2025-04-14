
import React, { useEffect, useRef } from 'react';
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
  
  const lastUpdateRef = useRef({
    adsCount: 0,
    revenueCount: 0,
    timestamp: 0
  });
  
  const [displayedAds, setDisplayedAds] = React.useState("0");
  const [displayedRevenue, setDisplayedRevenue] = React.useState("0");
  
  useEffect(() => {
    const now = Date.now();
    const timeDiff = now - lastUpdateRef.current.timestamp;
    const adsDiff = Math.abs(displayedAdsCount - lastUpdateRef.current.adsCount);
    const revenueDiff = Math.abs(displayedRevenueCount - lastUpdateRef.current.revenueCount);
    
    if (lastUpdateRef.current.timestamp === 0 || timeDiff > 1500 || adsDiff > 100 || revenueDiff > 200) {
      setDisplayedAds(displayedAdsCount.toLocaleString('fr-FR'));
      setDisplayedRevenue(formatRevenue(displayedRevenueCount));
      
      lastUpdateRef.current = {
        adsCount: displayedAdsCount,
        revenueCount: displayedRevenueCount,
        timestamp: now
      };
    }
  }, [displayedAdsCount, displayedRevenueCount]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full max-w-lg mb-6 md:mb-8 animate-slide-up">
      <StatPanel 
        value={displayedAds}
        label="Publicités analysées"
        className="animate-pulse-slow"
      />
      <StatPanel 
        value={displayedRevenue}
        label="Revenus générés"
        className="animate-pulse-slow"
      />
    </div>
  );
};

export default StatsCounter;
