
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
  // mais avec des incréments plus petits pour une meilleure lisibilité
  const animateCounters = useCallback(() => {
    // Mise à jour du compteur d'annonces - avec des incréments plus petits
    setDisplayedAdsCount((prevCount) => {
      // Si nous avons atteint la cible, ne pas changer
      if (prevCount >= adsCount) return adsCount;
      
      // Incréments beaucoup plus petits pour une animation plus lente et lisible
      const baseIncrement = Math.floor((adsCount - prevCount) * 0.01); // Réduit de 0.05 à 0.01
      const variationFactor = 0.7 + Math.random() * 0.6;
      // Limiter l'incrément à un maximum de 40 (plutôt que 350)
      const increment = Math.max(15, Math.min(40, Math.floor(baseIncrement * variationFactor)));
      
      return Math.min(prevCount + increment, adsCount);
    });

    // Mise à jour des revenus de manière indépendante avec plus de variation
    setDisplayedRevenueCount((prevRevCount) => {
      // Si nous avons atteint la cible, ne pas changer
      if (prevRevCount >= revenueCount) return revenueCount;
      
      // Incréments beaucoup plus petits pour les revenus également
      const baseIncrement = Math.floor((revenueCount - prevRevCount) * 0.01); // Réduit de 0.06 à 0.01
      const variationFactor = 0.5 + Math.random();
      // Limiter l'incrément à un maximum de 35 (plutôt que 150)
      const increment = Math.max(20, Math.floor(baseIncrement * variationFactor));
      
      return Math.min(prevRevCount + increment, revenueCount);
    });

    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
