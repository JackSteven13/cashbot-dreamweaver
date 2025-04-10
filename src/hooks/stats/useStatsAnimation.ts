
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
  // Animation redesignée pour simuler plusieurs agents IA travaillant simultanément
  const animateCounters = useCallback(() => {
    // Mise à jour du compteur d'annonces - accélérée considérablement
    setDisplayedAdsCount((prevCount) => {
      // Si nous avons atteint la cible, ne pas changer
      if (prevCount >= adsCount) return adsCount;
      
      // Incrémentation beaucoup plus agressive pour simuler plusieurs agents
      const increment = Math.max(200, Math.floor((adsCount - prevCount) * 0.08));
      return Math.min(prevCount + increment, adsCount);
    });

    // Mise à jour des revenus de manière indépendante - accélérée
    setDisplayedRevenueCount((prevRevCount) => {
      // Si nous avons atteint la cible, ne pas changer
      if (prevRevCount >= revenueCount) return revenueCount;
      
      // Incrémentation plus dynamique et agressive
      const increment = Math.max(350, Math.floor((revenueCount - prevRevCount) * 0.08));
      return Math.min(prevRevCount + increment, revenueCount);
    });

    // Renvoie true pour indiquer que l'animation est toujours active
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
