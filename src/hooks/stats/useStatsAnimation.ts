
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
  // Animate the counters more dramatically to impress users
  const animateCounters = useCallback(() => {
    // Add slight randomization to make the numbers feel more "alive"
    // but always try to catch up to the actual count
    const adsGap = adsCount - setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      // Move faster toward target with larger increments
      const increment = Math.max(Math.floor((adsCount - prevCount) * 0.2), 10);
      return Math.min(prevCount + increment, adsCount);
    });

    const revenueGap = revenueCount - setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      // Move faster toward target with larger increments
      const increment = Math.max(Math.floor((revenueCount - prevCount) * 0.2), 25);
      return Math.min(prevCount + increment, revenueCount);
    });

    return { adsGap, revenueGap };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
