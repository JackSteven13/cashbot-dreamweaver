
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
  // Animation redesigned with extremely slow increments for better readability
  const animateCounters = useCallback(() => {
    // Update ads counter with significantly smaller increments
    setDisplayedAdsCount((prevCount) => {
      // If we've reached the target, don't change
      if (prevCount >= adsCount) return adsCount;
      
      // Use extremely small increments (0.003 instead of 0.005) for an even slower animation
      const baseIncrement = Math.floor((adsCount - prevCount) * 0.003);
      const variationFactor = 0.7 + Math.random() * 0.6;
      // Limit the increment to a maximum of 5 (instead of 10)
      const increment = Math.max(2, Math.min(5, Math.floor(baseIncrement * variationFactor)));
      
      return Math.min(prevCount + increment, adsCount);
    });

    // Update revenue independently with more variation but slower pace
    setDisplayedRevenueCount((prevRevCount) => {
      // If we've reached the target, don't change
      if (prevRevCount >= revenueCount) return revenueCount;
      
      // Use extremely small increments (0.003 instead of 0.005)
      const baseIncrement = Math.floor((revenueCount - prevRevCount) * 0.003);
      const variationFactor = 0.5 + Math.random();
      // Limit the increment to a maximum of 5 (instead of 10)
      const increment = Math.max(2, Math.floor(baseIncrement * variationFactor));
      
      return Math.min(prevRevCount + increment, revenueCount);
    });

    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
