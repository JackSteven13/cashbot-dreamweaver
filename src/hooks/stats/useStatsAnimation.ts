
import { useCallback } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

const calculateCounterIncrement = (targetCount: number, currentCount: number): number => {
  // Réduire drastiquement le taux d'incrémentation (de 0.003 à 0.0005)
  const baseIncrement = Math.floor((targetCount - currentCount) * 0.0005);
  // Limiter la variation pour une progression plus stable
  const variationFactor = 0.8 + Math.random() * 0.3;
  // Limiter à un maximum de 2 pour des mouvements très graduels
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
