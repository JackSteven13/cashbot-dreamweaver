
import { useCallback, useState } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

// Calculer un incrément approprié pour une animation fluide et progressive
const calculateCounterIncrement = (targetCount: number, currentCount: number): number => {
  // Différence entre la valeur cible et actuelle
  const difference = targetCount - currentCount;
  
  // Si la différence est très faible, ne pas bouger
  if (Math.abs(difference) < 0.5) return 0;
  
  // Pour des animations naturelles et plus graduelles:
  // - Grandes différences: incrément plus petit (0.15% de la différence)
  // - Petites différences: incrément minimal
  const baseIncrement = Math.max(1, Math.ceil(Math.abs(difference) * 0.0015));
  
  // Limiter à un maximum raisonnable pour éviter des sauts trop grands
  const maxIncrement = Math.max(1, Math.floor(Math.abs(difference) / 50));
  
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
  // Track animation state locally for comparison
  const [prevAdsCount, setPrevAdsCount] = useState(0);
  const [prevRevenueCount, setPrevRevenueCount] = useState(0);
  
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
      const finalValue = increment > 0 
        ? Math.min(newValue, adsCount)
        : Math.max(newValue, adsCount);
        
      // Update previous value for next check
      setPrevAdsCount(finalValue);
      
      return finalValue;
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
      const finalValue = increment > 0
        ? Math.min(newValue, revenueCount)
        : Math.max(newValue, revenueCount);
        
      // Update previous value for next check
      setPrevRevenueCount(finalValue);
      
      return finalValue;
    });

    // Indiquer si l'animation est toujours active en comparant avec les valeurs précédentes stockées
    return { 
      animationActive: adsCount !== 0 && revenueCount !== 0 && 
                      (adsCount !== prevAdsCount || revenueCount !== prevRevenueCount)
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount, prevAdsCount, prevRevenueCount]);

  return { animateCounters };
};
