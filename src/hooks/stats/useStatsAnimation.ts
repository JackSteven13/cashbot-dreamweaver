
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
    // Mise à jour du compteur d'annonces - avec variation aléatoire pour simuler différents agents
    setDisplayedAdsCount((prevCount) => {
      // Si nous avons atteint la cible, ne pas changer
      if (prevCount >= adsCount) return adsCount;
      
      // Simuler plusieurs agents traitant des vidéos de durées différentes
      // Génère un incrément entre 80 et 350 annonces pour plus de variation
      const baseIncrement = Math.floor((adsCount - prevCount) * 0.05);
      const variationFactor = 0.7 + Math.random() * 0.6; // 70% à 130% de l'incrément de base
      const increment = Math.max(80, Math.min(350, Math.floor(baseIncrement * variationFactor)));
      
      return Math.min(prevCount + increment, adsCount);
    });

    // Mise à jour des revenus de manière indépendante avec plus de variation
    setDisplayedRevenueCount((prevRevCount) => {
      // Si nous avons atteint la cible, ne pas changer
      if (prevRevCount >= revenueCount) return revenueCount;
      
      // Simuler des publicités de valeurs différentes (entre 0.45€ et 3.30€)
      // Créer des sauts irréguliers pour plus de réalisme
      const baseIncrement = Math.floor((revenueCount - prevRevCount) * 0.06);
      // Plus grande variation pour les revenus (50% à 150%)
      const variationFactor = 0.5 + Math.random(); 
      const increment = Math.max(150, Math.floor(baseIncrement * variationFactor));
      
      return Math.min(prevRevCount + increment, revenueCount);
    });

    // Renvoie true pour indiquer que l'animation est toujours active
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
