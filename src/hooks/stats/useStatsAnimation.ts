
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
  // Animation redessinée pour simuler plusieurs agents IA travaillant simultanément avec des vitesses variables
  const animateCounters = useCallback(() => {
    // Mise à jour du compteur d'annonces avec variation aléatoire
    setDisplayedAdsCount((prevCount) => {
      // Si nous avons atteint la cible, ne pas changer
      if (prevCount >= adsCount) return adsCount;
      
      // Créer une incrémentation variable pour simuler des publicités de durées différentes
      // On utilise un facteur aléatoire plus important pour donner l'impression de plusieurs agents travaillant en parallèle
      const randomFactor = Math.random() * 0.06 + 0.04; // Entre 0.04 et 0.10
      const increment = Math.max(
        Math.floor(Math.random() * 150) + 80, // Base aléatoire entre 80 et 230
        Math.floor((adsCount - prevCount) * randomFactor) // Ou un pourcentage de la distance restante
      );
      
      return Math.min(prevCount + increment, adsCount);
    });

    // Mise à jour des revenus de manière indépendante mais corrélée
    setDisplayedRevenueCount((prevRevCount) => {
      // Si nous avons atteint la cible, ne pas changer
      if (prevRevCount >= revenueCount) return revenueCount;
      
      // Variabilité dans les revenus pour simuler des publicités avec des valeurs différentes
      const variabilityFactor = 0.9 + Math.random() * 0.4; // Entre 0.9 et 1.3
      
      // Créer une incrémentation variable
      const randomFactor = Math.random() * 0.07 + 0.03; // Entre 0.03 et 0.10
      const baseIncrement = Math.floor((revenueCount - prevRevCount) * randomFactor);
      const increment = Math.max(
        Math.floor(Math.random() * 280) + 120, // Base aléatoire entre 120 et 400
        Math.floor(baseIncrement * variabilityFactor) // Ajout de variabilité
      );
      
      return Math.min(prevRevCount + increment, revenueCount);
    });

    // Renvoie true pour indiquer que l'animation est toujours active
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
