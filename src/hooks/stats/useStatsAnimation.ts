
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
  // Animation extrêmement rapide pour des nombres impressionnants
  const animateCounters = useCallback(() => {
    // Mise à jour du nombre de publicités avec une animation ultra-rapide pour montrer un traitement massif
    setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      // Incréments beaucoup plus importants pour un effet visuel spectaculaire
      const increment = Math.max(Math.floor((adsCount - prevCount) * 0.8), 200);
      return Math.min(prevCount + increment, adsCount);
    });

    // Mise à jour du nombre de revenus seulement si le nombre de publicités augmente
    // Pour garantir que le revenu est lié aux publicités traitées
    setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      // Incréments massifs pour un effet visuel spectaculaire
      // Synchronisé avec la progression du compteur de publicités
      const increment = Math.max(Math.floor((revenueCount - prevCount) * 0.75), 150);
      return Math.min(prevCount + increment, revenueCount);
    });

    // Retourne true pour indiquer que l'animation est toujours active si l'un des compteurs n'a pas atteint sa cible
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
