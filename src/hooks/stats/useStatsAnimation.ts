
import { useCallback } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

const calculateCounterIncrement = (targetCount: number, currentCount: number): number => {
  // Reduce increment rate significantly for smoother progression
  const baseIncrement = Math.floor((targetCount - currentCount) * 0.0001);
  // Minimal variation factor for very stable progression
  const variationFactor = 0.95 + Math.random() * 0.1;
  // Maximum very low for gradual movements
  return Math.max(1, Math.min(2, Math.floor(baseIncrement * variationFactor)));
};

export const useStatsAnimation = ({
  adsCount,
  revenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount
}: UseStatsAnimationParams) => {
  const animateCounters = useCallback(() => {
    setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      const increment = calculateCounterIncrement(adsCount, prevCount);
      return Math.min(prevCount + increment, adsCount);
    });

    setDisplayedRevenueCount((prevRevCount) => {
      if (prevRevCount >= revenueCount) return revenueCount;
      const increment = calculateCounterIncrement(revenueCount, prevRevCount);
      return Math.min(prevRevCount + increment, revenueCount);
    });

    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
