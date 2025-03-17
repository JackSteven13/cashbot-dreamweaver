
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
  // Animate the counters more dramatically to impress users
  const animateCounters = useCallback(() => {
    // Update ad count with more aggressive animation
    setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      // Much larger increments for more dramatic movement (50% faster)
      const increment = Math.max(Math.floor((adsCount - prevCount) * 0.3), 25);
      return Math.min(prevCount + increment, adsCount);
    });

    // Update revenue count with more aggressive animation
    setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      // Much larger increments for more dramatic movement (50% faster)
      const increment = Math.max(Math.floor((revenueCount - prevCount) * 0.3), 60);
      return Math.min(prevCount + increment, revenueCount);
    });

    // Return true to indicate animation is still active if either count hasn't reached target
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
