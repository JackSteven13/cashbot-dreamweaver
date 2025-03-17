
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
  // Complete redesign of animation logic to ensure stability
  const animateCounters = useCallback(() => {
    // Update ad count with stable animation
    setDisplayedAdsCount((prevCount) => {
      // If we've reached the target, don't change
      if (prevCount >= adsCount) return adsCount;
      
      // Use extremely small fixed increment for stability
      // This ensures values only go up, never down
      const increment = Math.max(1, Math.floor((adsCount - prevCount) * 0.005));
      return Math.min(prevCount + increment, adsCount);
    });

    // Update revenue independently with stable animation
    setDisplayedRevenueCount((prevRevCount) => {
      // If we've reached the target, don't change
      if (prevRevCount >= revenueCount) return revenueCount;
      
      // Use extremely small fixed increment for stability
      // This ensures values only go up, never down
      const increment = Math.max(1, Math.floor((revenueCount - prevRevCount) * 0.005));
      return Math.min(prevRevCount + increment, revenueCount);
    });

    // Return true to indicate animation is still active if either counter hasn't reached its target
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
