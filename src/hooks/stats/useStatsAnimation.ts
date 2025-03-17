
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
  // Animation speed references
  const adsAnimationSpeedRef = useRef(1);
  const revenueAnimationSpeedRef = useRef(1);
  
  // Animation function
  const animateCounters = useCallback(() => {
    // Randomly adjust animation speeds occasionally for visual interest
    if (Math.random() < 0.1) {
      adsAnimationSpeedRef.current = 0.5 + Math.random() * 1.5;
      revenueAnimationSpeedRef.current = 0.5 + Math.random() * 1.5;
    }
    
    setDisplayedAdsCount(prev => {
      // Add random variations to increment speed
      const diff = adsCount - prev;
      if (diff <= 0) return prev;
      
      // Faster animation when further from target
      const increment = Math.ceil(Math.max(1, diff * 0.05 * adsAnimationSpeedRef.current));
      return Math.min(prev + increment, adsCount);
    });
    
    setDisplayedRevenueCount(prev => {
      const diff = revenueCount - prev;
      if (diff <= 0) return prev;
      
      // Faster animation when further from target
      const increment = Math.ceil(Math.max(1, diff * 0.05 * revenueAnimationSpeedRef.current));
      return Math.min(prev + increment, revenueCount);
    });
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
