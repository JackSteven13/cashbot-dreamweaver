
import { useCallback, useState, useRef } from 'react';

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
  // Réduire considérablement la probabilité à 1% (de 4% à 1%)
  const isBoostMode = Math.random() > 0.99;
  
  // Incrément de base avec différents facteurs selon le mode
  // Réduction significative des facteurs pour ralentir l'animation
  let baseIncrementFactor = isBoostMode ? 0.010 : 0.001; // Réduit de 0.020/0.002 à 0.010/0.001
  
  // Pour les grands écarts, augmenter le facteur de base
  if (Math.abs(difference) > 10000) {
    baseIncrementFactor *= 1.1; // Réduit de 1.2 à 1.1
  }
  
  // Calculer l'incrément avec une légère variation aléatoire
  const randomFactor = 0.85 + (Math.random() * 0.3); // 85% à 115% de l'incrément calculé
  const baseIncrement = Math.max(1, Math.ceil(Math.abs(difference) * baseIncrementFactor * randomFactor));
  
  // Limiter à un maximum raisonnable pour éviter des sauts visibles
  // Augmenter les diviseurs pour avoir des incréments plus petits
  const maxIncrement = isBoostMode ? 
    Math.max(1, Math.floor(Math.abs(difference) / 80)) : // Pour les bursts: augmenté de 50 à 80
    Math.max(1, Math.floor(Math.abs(difference) / 300));  // Pour le mode normal: augmenté de 200 à 300
  
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
  
  // Référence pour l'heure de la dernière mise à jour
  const lastUpdateTime = useRef<number>(Date.now());
  
  const animateCounters = useCallback(() => {
    // Calculer le temps écoulé depuis la dernière mise à jour
    const now = Date.now();
    const elapsedTime = now - lastUpdateTime.current;
    
    // Ralentir davantage les animations en n'actualisant que toutes les 60-90ms (au lieu de 40-60ms)
    if (elapsedTime < 60 + Math.random() * 30) {
      return { animationActive: true }; // Continuer l'animation sans changer les valeurs
    }
    
    // Mettre à jour le temps de la dernière mise à jour
    lastUpdateTime.current = now;
    
    // Réduire encore plus la fréquence des mises à jour pour une animation plus fluide
    setUpdateSkipCounter(prev => {
      // Déterminer si on saute cette frame (mais parfois permettre des updates consécutives)
      // Réduire davantage la probabilité de ne pas sauter (de 15% à 10%)
      const shouldSkipFrame = Math.random() > 0.10;
      
      if (prev < 4 && shouldSkipFrame) { // Augmenté de 3 à 4 pour sauter plus de frames
        return prev + 1; // Sauter certaines frames
      }
      
      // Simuler des "bursts" d'activité comme si plusieurs bots terminaient en même temps
      // Réduire la probabilité de burst de 3% à 1%
      const isBurstMode = Math.random() > 0.99;
      
      // Animer le compteur d'annonces avec un rythme plus irrégulier
      setDisplayedAdsCount((prevCount) => {
        // Si déjà à la valeur cible, ne pas changer
        if (Math.abs(prevCount - adsCount) < 1) return adsCount;
        
        // Simuler différentes vitesses de traitement selon le mode
        const increment = isBurstMode 
          ? calculateCounterIncrement(adsCount, prevCount) * 2.0 // Burst: réduit de 2.5x à 2.0x
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
        // Réduire la probabilité de pubs premium de 7% à 4%
        const isPremiumAdBatch = Math.random() > 0.96; // 4% de chance de traiter des pubs premium
        
        const increment = isPremiumAdBatch 
          ? calculateCounterIncrement(revenueCount, prevCount) * 2.5 // Publicités premium: réduit de 3.0x à 2.5x
          : (isBurstMode 
            ? calculateCounterIncrement(revenueCount, prevCount) * 1.5 // Burst normal: réduit de 1.8x à 1.5x
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
