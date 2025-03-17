
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

    // Mise à jour du nombre de revenus avec des sauts ÉNORMES et TRÈS VISIBLES
    setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      
      // Variation aléatoire EXTRÊME pour simuler des publicités à haute valeur
      const randomFactor = Math.random();
      let increment;
      
      if (randomFactor > 0.95) {
        // Sauts GIGANTESQUES rares (15-30€ par pub)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.85), 3000);
        console.log("💎💎💎 PUBLICITÉ ULTRA-PREMIUM: +3000€!");
      } else if (randomFactor > 0.85) {
        // Grands sauts occasionnels (10-15€ par pub)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.75), 1500);
        console.log("💰💰 PUBLICITÉ PREMIUM: +1500€!");
      } else if (randomFactor > 0.65) {
        // Sauts moyens fréquents (5-10€ par pub)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.65), 800);
        console.log("💰 Publicité à haute valeur: +800€");
      } else if (randomFactor > 0.4) {
        // Petits sauts mais toujours visibles (3-5€ par pub)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.5), 400);
      } else {
        // Incréments standard (1-3€ par pub)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.3), 200);
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
