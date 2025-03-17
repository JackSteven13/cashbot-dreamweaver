
import { useCallback } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

export const useStatsAnimation = ({
  adsCount,
  revenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount
}: UseStatsAnimationParams) => {
  // Animate the counters much more dramatically to impress users
  const animateCounters = useCallback(() => {
    // Update ad count with extremely aggressive animation
    setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      // Very large increments for dramatic movement (300% faster)
      const increment = Math.max(Math.floor((adsCount - prevCount) * 0.5), 75);
      return Math.min(prevCount + increment, adsCount);
    });

    // Update revenue count with extremely aggressive animation
    setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      // Very large increments for dramatic movement (300% faster)
      const increment = Math.max(Math.floor((revenueCount - prevCount) * 0.5), 120);
      return Math.min(prevCount + increment, revenueCount);
    });

    // Return true to indicate animation is still active if either count hasn't reached target
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
