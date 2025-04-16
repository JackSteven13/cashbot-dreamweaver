
import { useCallback } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

// Calculer un incrément approprié pour une animation fluide
const calculateCounterIncrement = (targetCount: number, currentCount: number): number => {
  // Différence entre la valeur cible et actuelle
  const difference = targetCount - currentCount;
  
  // Si la différence est très faible, ne pas bouger
  if (Math.abs(difference) < 2) return 0;
  
  // Pour des animations naturelles:
  // - Grandes différences: incrément plus grand (0.5% de la différence)
  // - Petites différences: incrément minimal
  const baseIncrement = Math.max(1, Math.ceil(Math.abs(difference) * 0.005));
  
  // Limiter à un maximum raisonnable pour éviter des sauts trop grands
  const maxIncrement = Math.max(1, Math.floor(Math.abs(difference) / 10));
  
  // Retourner l'incrément avec le signe approprié
  return difference > 0 ? 
    Math.min(baseIncrement, maxIncrement) : 
    -Math.min(baseIncrement, maxIncrement);
};

export const useStatsAnimation = ({
  adsCount,
  revenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount
}: UseStatsAnimationParams) => {
  const animateCounters = useCallback(() => {
    // Animer le compteur d'annonces
    setDisplayedAdsCount((prevCount) => {
      // Si déjà à la valeur cible, ne pas changer
      if (prevCount === adsCount) return prevCount;
      
      const increment = calculateCounterIncrement(adsCount, prevCount);
      
      // Si l'incrément est 0, ne pas changer la valeur
      if (increment === 0) return prevCount;
      
      // Calculer la nouvelle valeur
      const newValue = prevCount + increment;
      
      // Garantir qu'on ne dépasse pas la cible (dans les deux directions)
      if (increment > 0) {
        return Math.min(newValue, adsCount);
      } else {
        return Math.max(newValue, adsCount);
      }
    });

    // Animer le compteur de revenus
    setDisplayedRevenueCount((prevCount) => {
      // Si déjà à la valeur cible, ne pas changer
      if (prevCount === revenueCount) return prevCount;
      
      const increment = calculateCounterIncrement(revenueCount, prevCount);
      
      // Si l'incrément est 0, ne pas changer la valeur
      if (increment === 0) return prevCount;
      
      // Calculer la nouvelle valeur
      const newValue = prevCount + increment;
      
      // Garantir qu'on ne dépasse pas la cible (dans les deux directions)
      if (increment > 0) {
        return Math.min(newValue, revenueCount);
      } else {
        return Math.max(newValue, revenueCount);
      }
    });

    // Indiquer si l'animation est toujours active
    return { 
      animationActive: adsCount !== 0 && revenueCount !== 0 && 
                      (adsCount !== displayedAdsCount || revenueCount !== displayedRevenueCount)
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
