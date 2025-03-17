
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

    // Mise à jour du nombre de revenus avec des sauts TRÈS VISIBLES pour refléter des publicités à forte valeur
    setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      
      // Variation aléatoire EXTRÊME pour simuler des publicités à haute valeur
      // Parfois des ÉNORMES sauts (publicités jusqu'à 15€)
      const randomFactor = Math.random();
      let increment;
      
      if (randomFactor > 0.95) {
        // Sauts GIGANTESQUES rares (10-15€)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.9), 1500);
        console.log("🚀 PUBLICITÉ PREMIUM DÉTECTÉE: +1500€ minimum!");
      } else if (randomFactor > 0.85) {
        // Grands sauts occasionnels (5-8€)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.85), 800);
        console.log("💰 Publicité à haute valeur: +800€ minimum");
      } else if (randomFactor > 0.6) {
        // Sauts moyens fréquents (3-5€)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.8), 400);
      } else {
        // Incréments plus petits mais toujours impressionnants
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.75), 200);
      }
      
      return Math.min(prevCount + increment, revenueCount);
    });

    // Retourne true pour indiquer que l'animation est toujours active si l'un des compteurs n'a pas atteint sa cible
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
