
import { useCallback, useState, useRef, useEffect } from 'react';

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
  const isBoostMode = Math.random() > 0.99;
  
  // Incrément de base avec différents facteurs selon le mode
  let baseIncrementFactor = isBoostMode ? 0.01 : 0.001;
  
  // Pour les grands écarts, augmenter le facteur de base
  if (Math.abs(difference) > 10000) {
    baseIncrementFactor *= 1.2;
  }
  
  // Calculer l'incrément avec une légère variation aléatoire
  const randomFactor = 0.85 + (Math.random() * 0.3); // 85% à 115% de l'incrément calculé
  const baseIncrement = Math.max(1, Math.ceil(Math.abs(difference) * baseIncrementFactor * randomFactor));
  
  // Limiter à un maximum raisonnable pour éviter des sauts visibles
  const maxIncrement = isBoostMode ? 
    Math.max(1, Math.floor(Math.abs(difference) / 80)) : // Pour les bursts
    Math.max(1, Math.floor(Math.abs(difference) / 300));  // Pour le mode normal
  
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
  
  // Forcer des mises à jour périodiques
  useEffect(() => {
    const handleForcedUpdate = () => {
      // Ajouter de petites progressions régulières
      setDisplayedAdsCount(prev => {
        if (Math.abs(prev - adsCount) < 1) return adsCount;
        const increment = 10 + Math.floor(Math.random() * 30);
        return Math.min(prev + increment, adsCount);
      });
      
      setDisplayedRevenueCount(prev => {
        if (Math.abs(prev - revenueCount) < 1) return revenueCount;
        const increment = 15 + Math.floor(Math.random() * 35);
        return Math.min(prev + increment, revenueCount);
      });
    };
    
    window.addEventListener('stats:update', handleForcedUpdate);
    return () => window.removeEventListener('stats:update', handleForcedUpdate);
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  const animateCounters = useCallback(() => {
    // Calculer le temps écoulé depuis la dernière mise à jour
    const now = Date.now();
    const elapsedTime = now - lastUpdateTime.current;
    
    // Ralentir les animations en n'actualisant que toutes les 70-90ms
    if (elapsedTime < 70 + Math.random() * 20) {
      return { animationActive: true }; // Continuer l'animation sans changer les valeurs
    }
    
    // Mettre à jour le temps de la dernière mise à jour
    lastUpdateTime.current = now;
    
    // Réduire la fréquence des mises à jour pour une animation plus fluide
    setUpdateSkipCounter(prev => {
      // Déterminer si on saute cette frame (mais parfois permettre des updates consécutives)
      const shouldSkipFrame = Math.random() > 0.1;
      
      if (prev < 4 && shouldSkipFrame) {
        return prev + 1; // Sauter certaines frames
      }
      
      // Simuler des "bursts" d'activité comme si plusieurs bots terminaient en même temps
      const isBurstMode = Math.random() > 0.99;
      
      // Animer le compteur d'annonces
      setDisplayedAdsCount((prevCount) => {
        // S'assurer que la valeur ne descend jamais sous zéro
        if (prevCount <= 0 && adsCount <= 0) return 0;
        
        // Si déjà à la valeur cible, ne pas changer
        if (Math.abs(prevCount - adsCount) < 1) return adsCount;
        
        // Simuler différentes vitesses de traitement selon le mode
        const increment = isBurstMode 
          ? calculateCounterIncrement(adsCount, prevCount) * 2.0
          : calculateCounterIncrement(adsCount, prevCount);
        
        // Si l'incrément est 0, ne pas changer la valeur
        if (increment === 0) return prevCount;
        
        // Calculer la nouvelle valeur avec une progression plus dynamique
        const newValue = prevCount + increment;
        
        // Garantir qu'on ne dépasse pas la cible (dans les deux directions)
        // Et s'assurer qu'on ne descend pas sous zéro
        const finalValue = increment > 0 
          ? Math.min(newValue, adsCount)
          : Math.max(Math.max(newValue, adsCount), 0);
          
        // Stocker la valeur précédente pour la comparaison
        setPrevAdsCount(finalValue);
        
        return finalValue;
      });

      // Animer le compteur de revenus avec la même logique mais avec des seuils différents
      setDisplayedRevenueCount((prevCount) => {
        // S'assurer que la valeur ne descend jamais sous zéro
        if (prevCount <= 0 && revenueCount <= 0) return 0;
        
        // Si déjà à la valeur cible, ne pas changer
        if (Math.abs(prevCount - revenueCount) < 1) return revenueCount;
        
        // Simuler des pics de revenus (comme si des publicités premium étaient traitées)
        const isPremiumAdBatch = Math.random() > 0.96; // 4% de chance de traiter des pubs premium
        
        const increment = isPremiumAdBatch 
          ? calculateCounterIncrement(revenueCount, prevCount) * 2.5
          : (isBurstMode 
            ? calculateCounterIncrement(revenueCount, prevCount) * 1.5
            : calculateCounterIncrement(revenueCount, prevCount));
        
        // Si l'incrément est 0, ne pas changer la valeur
        if (increment === 0) return prevCount;
        
        // Calculer la nouvelle valeur avec une progression plus variable
        const newValue = prevCount + increment;
        
        // Garantir qu'on ne dépasse pas la cible (dans les deux directions)
        // Et s'assurer qu'on ne descend pas sous zéro
        const finalValue = increment > 0
          ? Math.min(newValue, revenueCount)
          : Math.max(Math.max(newValue, revenueCount), 0);
          
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
