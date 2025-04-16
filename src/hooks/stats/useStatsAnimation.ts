
import { useCallback } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

const calculateCounterIncrement = (targetCount: number, currentCount: number): number => {
  // Réduire encore le taux d'incrémentation pour une progression plus douce
  const baseIncrement = Math.floor((targetCount - currentCount) * 0.0003);
  // Variation minimale pour une progression très stable
  const variationFactor = 0.9 + Math.random() * 0.2;
  // Maximum très bas pour des mouvements graduels
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
