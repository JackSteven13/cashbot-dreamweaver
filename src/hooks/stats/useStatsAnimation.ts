
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
  // Animation speed references (constantes pour plus de stabilité)
  const adsAnimationSpeedRef = useRef(0.8);
  const revenueAnimationSpeedRef = useRef(0.8);
  
  // Animation function
  const animateCounters = useCallback(() => {
    // Suppression de la variation aléatoire pour plus de stabilité
    
    setDisplayedAdsCount(prev => {
      const diff = adsCount - prev;
      if (diff <= 0) return prev;
      
      // Animation plus douce et constante
      const increment = Math.ceil(Math.max(1, diff * 0.03 * adsAnimationSpeedRef.current));
      return Math.min(prev + increment, adsCount);
    });
    
    setDisplayedRevenueCount(prev => {
      const diff = revenueCount - prev;
      if (diff <= 0) return prev;
      
      // Animation plus douce et constante
      const increment = Math.ceil(Math.max(1, diff * 0.03 * revenueAnimationSpeedRef.current));
      return Math.min(prev + increment, revenueCount);
    });
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
