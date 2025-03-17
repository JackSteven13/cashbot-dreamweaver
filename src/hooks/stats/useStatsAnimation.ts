
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
  // Animate counters with extremely rapid jumps
  const animateCounters = useCallback(() => {
    // Update ad count with ultra-fast animation
    setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      // Massive increments for extreme speed (10+ ads per second)
      const increment = Math.max(Math.floor((adsCount - prevCount) * 0.3), 3);
      return Math.min(prevCount + increment, adsCount);
    });

    // Update revenue count only if ads count is increasing
    // This ensures revenue is tied to ads being processed
    setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      // Massive increments for extreme speed (15€+ per 2 seconds)
      // Synchronized with ad count progression
      const increment = Math.max(Math.floor((revenueCount - prevCount) * 0.25), 2);
      return Math.min(prevCount + increment, revenueCount);
    });

    // Return true to indicate animation is still active if either count hasn't reached target
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
