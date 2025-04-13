
import React, { useEffect, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 650000, // Reduced from 850000 for slower progress
  dailyRevenueTarget = 1250000 // Reduced from 1750000 for consistency
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  // Reference to avoid too frequent UI refreshes
  const lastUpdateRef = useRef({
    adsCount: 0,
    revenueCount: 0,
    timestamp: 0
  });
  
  // Formatted values for display
  const [displayedAds, setDisplayedAds] = React.useState("0");
  const [displayedRevenue, setDisplayedRevenue] = React.useState("0");
  
  // Update the display only if the difference is significant
  // or if a certain time has elapsed - with longer intervals
  useEffect(() => {
    const now = Date.now();
    const timeDiff = now - lastUpdateRef.current.timestamp;
    const adsDiff = Math.abs(displayedAdsCount - lastUpdateRef.current.adsCount);
    const revenueDiff = Math.abs(displayedRevenueCount - lastUpdateRef.current.revenueCount);
    
    // Update only if:
    // - It's the first update
    // - At least 3 seconds have elapsed since the last update (increased from 1.5s)
    // - The difference in ads is at least 50 (reduced from 100 for smoother updates)
    // - The difference in revenue is at least 100 (reduced from 200)
    if (
      lastUpdateRef.current.timestamp === 0 ||
      timeDiff > 3000 ||
      adsDiff > 50 ||
      revenueDiff > 100
    ) {
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
      />
      <StatPanel 
        value={displayedRevenue}
        label="Revenus générés"
      />
    </div>
  );
};

export default StatsCounter;
