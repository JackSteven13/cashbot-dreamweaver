
import { useCallback } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

// Réduire considérablement le taux d'incrémentation pour des mouvements beaucoup plus lents
const calculateCounterIncrement = (targetCount: number, currentCount: number): number => {
  // Utiliser un pourcentage extrêmement faible pour un changement très progressif
  const diffPercent = Math.abs(targetCount - currentCount) / targetCount;
  
  // Si la différence est minuscule, ne pas bouger du tout
  if (diffPercent < 0.0002) return 0;
  
  // Incrément de base très faible (0.005% de la différence)
  const baseIncrement = Math.max(1, Math.floor((targetCount - currentCount) * 0.00005));
  
  // Limiter à un maximum très bas pour des mouvements imperceptibles
  return Math.min(baseIncrement, 1);
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
      // Si l'incrément est 0, ne pas changer la valeur
      if (increment === 0) return prevCount;
      return Math.min(prevCount + increment, adsCount);
    });

    setDisplayedRevenueCount((prevRevCount) => {
      if (prevRevCount >= revenueCount) return revenueCount;
      const increment = calculateCounterIncrement(revenueCount, prevRevCount);
      // Si l'incrément est 0, ne pas changer la valeur
      if (increment === 0) return prevRevCount;
      return Math.min(prevRevCount + increment, revenueCount);
    });

    // Indiquer si l'animation est toujours active
    return { 
      animationActive: adsCount > 0 && revenueCount > 0
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
