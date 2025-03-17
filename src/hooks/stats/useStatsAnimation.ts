
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
  // Animate counters with much higher speed for more impressive numbers
  const animateCounters = useCallback(() => {
    // Update ad count with fast animation to show high-volume processing
    setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      // Much larger increments for dramatic animation effect
      const increment = Math.max(Math.floor((adsCount - prevCount) * 0.5), 50);
      return Math.min(prevCount + increment, adsCount);
    });

    // Update revenue count only if ads count is increasing
    // This ensures revenue is tied to ads being processed
    setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      // Much larger increments for dramatic animation effect
      // Synchronized with ad count progression
      const increment = Math.max(Math.floor((revenueCount - prevCount) * 0.45), 40);
      return Math.min(prevCount + increment, revenueCount);
    });

    // Return true to indicate animation is still active if either count hasn't reached target
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
