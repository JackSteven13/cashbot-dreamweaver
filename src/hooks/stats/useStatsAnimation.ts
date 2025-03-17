
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
      // Massive increments for extreme speed (1000+ ads per second)
      const increment = Math.max(Math.floor((adsCount - prevCount) * 0.2), 500);
      return Math.min(prevCount + increment, adsCount);
    });

    // Update revenue count with ultra-fast animation
    setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      // Massive increments for extreme speed (15€+ per second)
      const increment = Math.max(Math.floor((revenueCount - prevCount) * 0.2), 800);
      return Math.min(prevCount + increment, revenueCount);
    });

    // Return true to indicate animation is still active if either count hasn't reached target
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
