
import { useRef, useCallback } from 'react';

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
  // Animation speed references (constant values for stability)
  const adsAnimationSpeedRef = useRef(0.5); // Reduced from 0.8 for smoother animation
  const revenueAnimationSpeedRef = useRef(0.5); // Reduced from 0.8 for smoother animation
  
  // Animation function
  const animateCounters = useCallback(() => {
    // Smooth, consistent animation with less jitter
    
    setDisplayedAdsCount(prev => {
      const diff = adsCount - prev;
      if (diff <= 0) return prev;
      
      // Smoother, more consistent animation with smaller increments
      const increment = Math.ceil(Math.max(1, diff * 0.02 * adsAnimationSpeedRef.current));
      return Math.min(prev + increment, adsCount);
    });
    
    setDisplayedRevenueCount(prev => {
      const diff = revenueCount - prev;
      if (diff <= 0) return prev;
      
      // Smoother, more consistent animation with smaller increments
      const increment = Math.ceil(Math.max(1, diff * 0.02 * revenueAnimationSpeedRef.current));
      return Math.min(prev + increment, revenueCount);
    });
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
