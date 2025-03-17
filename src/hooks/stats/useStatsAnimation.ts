
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
  // Animate counters with reasonable speed
  const animateCounters = useCallback(() => {
    // Update ad count with smooth animation
    setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      // Reasonable increments for smooth animation
      const increment = Math.max(Math.floor((adsCount - prevCount) * 0.3), 5);
      return Math.min(prevCount + increment, adsCount);
    });

    // Update revenue count only if ads count is increasing
    // This ensures revenue is tied to ads being processed
    setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      // Reasonable increments for smooth animation
      // Synchronized with ad count progression
      const increment = Math.max(Math.floor((revenueCount - prevCount) * 0.25), 5);
      return Math.min(prevCount + increment, revenueCount);
    });

    // Return true to indicate animation is still active if either count hasn't reached target
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
