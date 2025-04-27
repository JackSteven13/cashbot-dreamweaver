
import { useState, useCallback } from 'react';

export const useStatsAnimation = (adsCount: number, revenueCount: number) => {
  const [displayedAdsCount, setDisplayedAdsCount] = useState(adsCount);
  const [displayedRevenueCount, setDisplayedRevenueCount] = useState(revenueCount);

  const animateCounters = useCallback((targetAdsCount: number, targetRevenueCount: number) => {
    setDisplayedAdsCount(targetAdsCount);
    setDisplayedRevenueCount(targetRevenueCount);
  }, []);

  return {
    displayedAdsCount,
    displayedRevenueCount,
    animateCounters
  };
};
