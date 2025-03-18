
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
  // Animation redesigned to be much faster and give impression of high activity
  const animateCounters = useCallback(() => {
    // Update ad count with more aggressive animation
    setDisplayedAdsCount((prevCount) => {
      // If we've reached the target, don't change
      if (prevCount >= adsCount) return adsCount;
      
      // Use larger increment for faster, more impressive growth
      const increment = Math.max(100, Math.floor((adsCount - prevCount) * 0.05));
      return Math.min(prevCount + increment, adsCount);
    });

    // Update revenue independently with more aggressive animation
    setDisplayedRevenueCount((prevRevCount) => {
      // If we've reached the target, don't change
      if (prevRevCount >= revenueCount) return revenueCount;
      
      // Use larger increment for faster, more impressive growth
      const increment = Math.max(100, Math.floor((revenueCount - prevRevCount) * 0.05));
      return Math.min(prevRevCount + increment, revenueCount);
    });

    // Return true to indicate animation is still active
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
