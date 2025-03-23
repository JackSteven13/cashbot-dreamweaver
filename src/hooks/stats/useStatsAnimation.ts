
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
  // Animation redesignée pour être plus crédible
  const animateCounters = useCallback(() => {
    // Mise à jour du compteur d'annonces
    setDisplayedAdsCount((prevCount) => {
      // Si nous avons atteint la cible, ne pas changer
      if (prevCount >= adsCount) return adsCount;
      
      // Incrémentation progressive plus réaliste
      const increment = Math.max(5, Math.floor((adsCount - prevCount) * 0.02));
      return Math.min(prevCount + increment, adsCount);
    });

    // Mise à jour des revenus de manière indépendante
    setDisplayedRevenueCount((prevRevCount) => {
      // Si nous avons atteint la cible, ne pas changer
      if (prevRevCount >= revenueCount) return revenueCount;
      
      // Incrémentation progressive plus réaliste
      const increment = Math.max(10, Math.floor((revenueCount - prevRevCount) * 0.02));
      return Math.min(prevRevCount + increment, revenueCount);
    });

    // Renvoie true pour indiquer que l'animation est toujours active
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
