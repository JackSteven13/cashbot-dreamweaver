
import { useCallback, useState } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

// Calculer un incrément approprié pour une animation fluide avec simulation de comportement de bots
const calculateCounterIncrement = (targetCount: number, currentCount: number): number => {
  // Différence entre la valeur cible et actuelle
  const difference = targetCount - currentCount;
  
  // Si la différence est très faible, ne pas bouger
  if (Math.abs(difference) < 0.5) return 0;
  
  // Simuler des irrégularités comme celles de vrais bots
  // - Parfois, un bot traite un gros lot d'annonces d'un coup
  // - D'autres fois, le traitement est plus progressif
  
  // Probabilité d'un "boost" dans le traitement (comme si plusieurs bots finissaient en même temps)
  const isBoostMode = Math.random() > 0.92;
  
  // Incrément de base avec différents facteurs selon le mode
  let baseIncrementFactor = isBoostMode ? 0.035 : 0.004; // 3.5% ou 0.4% de la différence
  
  // Pour les grands écarts, augmenter le facteur de base
  if (Math.abs(difference) > 10000) {
    baseIncrementFactor *= 1.5;
  }
  
  // Calculer l'incrément avec une légère variation aléatoire
  const randomFactor = 0.8 + (Math.random() * 0.4); // 80% à 120% de l'incrément calculé
  const baseIncrement = Math.max(1, Math.ceil(Math.abs(difference) * baseIncrementFactor * randomFactor));
  
  // Limiter à un maximum raisonnable pour éviter des sauts visibles mais permettre des bursts occasionnels
  const maxIncrement = isBoostMode ? 
    Math.max(1, Math.floor(Math.abs(difference) / 30)) : // Pour les bursts: divisions plus importantes
    Math.max(1, Math.floor(Math.abs(difference) / 120));  // Pour le mode normal
  
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
  // Suivre l'état des animations pour comparaisons
  const [prevAdsCount, setPrevAdsCount] = useState(0);
  const [prevRevenueCount, setPrevRevenueCount] = useState(0);
  
  // Compteur pour ralentir les mises à jour d'animation
  const [updateSkipCounter, setUpdateSkipCounter] = useState(0);
  
  const animateCounters = useCallback(() => {
    // Réduire la fréquence des mises à jour pour une animation plus fluide
    // mais avec des "bursts" occasionnels pour simuler l'activité réelle des bots
    setUpdateSkipCounter(prev => {
      // Déterminer si on saute cette frame (mais parfois permettre des updates consécutives)
      const shouldSkipFrame = Math.random() > 0.2; // 20% de chance de NE PAS sauter
      
      if (prev < 2 && shouldSkipFrame) {
        return prev + 1; // Sauter certaines frames
      }
      
      // Simuler des "bursts" d'activité comme si plusieurs bots terminaient en même temps
      const isBurstMode = Math.random() > 0.95; // 5% de chance d'un burst d'activité
      
      // Animer le compteur d'annonces avec un rythme plus irrégulier
      setDisplayedAdsCount((prevCount) => {
        // Si déjà à la valeur cible, ne pas changer
        if (Math.abs(prevCount - adsCount) < 1) return adsCount;
        
        // Simuler différentes vitesses de traitement selon le mode
        const increment = isBurstMode 
          ? calculateCounterIncrement(adsCount, prevCount) * 3 // Burst: 3x plus rapide
          : calculateCounterIncrement(adsCount, prevCount);
        
        // Si l'incrément est 0, ne pas changer la valeur
        if (increment === 0) return prevCount;
        
        // Calculer la nouvelle valeur avec une progression plus dynamique
        const newValue = prevCount + increment;
        
        // Garantir qu'on ne dépasse pas la cible (dans les deux directions)
        const finalValue = increment > 0 
          ? Math.min(newValue, adsCount)
          : Math.max(newValue, adsCount);
          
        // Stocker la valeur précédente pour la comparaison
        setPrevAdsCount(finalValue);
        
        return finalValue;
      });

      // Animer le compteur de revenus avec la même logique mais avec des seuils différents
      // pour tenir compte des différents types de publicités et leurs valeurs
      setDisplayedRevenueCount((prevCount) => {
        // Si déjà à la valeur cible, ne pas changer
        if (Math.abs(prevCount - revenueCount) < 1) return revenueCount;
        
        // Simuler des pics de revenus (comme si des publicités premium étaient traitées)
        const isPremiumAdBatch = Math.random() > 0.9; // 10% de chance de traiter des pubs premium
        
        const increment = isPremiumAdBatch 
          ? calculateCounterIncrement(revenueCount, prevCount) * 3.5 // Publicités premium: plus de revenus
          : (isBurstMode 
            ? calculateCounterIncrement(revenueCount, prevCount) * 2 // Burst normal
            : calculateCounterIncrement(revenueCount, prevCount));   // Progression standard
        
        // Si l'incrément est 0, ne pas changer la valeur
        if (increment === 0) return prevCount;
        
        // Calculer la nouvelle valeur avec une progression plus variable
        const newValue = prevCount + increment;
        
        // Garantir qu'on ne dépasse pas la cible (dans les deux directions)
        const finalValue = increment > 0
          ? Math.min(newValue, revenueCount)
          : Math.max(newValue, revenueCount);
          
        // Stocker la valeur précédente pour la comparaison
        setPrevRevenueCount(finalValue);
        
        return finalValue;
      });
      
      return 0; // Réinitialiser le compteur
    });

    // Indiquer si l'animation est toujours active en comparant avec les valeurs cibles
    return { 
      animationActive: adsCount !== 0 && revenueCount !== 0 && 
                      (Math.abs(adsCount - prevAdsCount) > 1 || 
                       Math.abs(revenueCount - prevRevenueCount) > 1)
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount, prevAdsCount, prevRevenueCount]);

  return { animateCounters };
};
