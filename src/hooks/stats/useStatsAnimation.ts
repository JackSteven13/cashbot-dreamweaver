
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
  
  // Un facteur beaucoup plus petit pour une progression plus réaliste
  // - Pour 20 bots traitant des vidéos de 20-60 secondes
  // - Cela fait ~20 vidéos par minute en moyenne
  
  // Probabilité d'un petit "boost" dans le traitement (comme si plusieurs bots finissaient en même temps)
  const isBoostMode = Math.random() > 0.95;
  
  // Incrément de base beaucoup plus petit pour une progression plus réaliste
  // Réduit considérablement pour éviter des sauts de centaines par seconde
  let baseIncrementFactor = isBoostMode ? 0.008 : 0.002;
  
  // Pour les grands écarts, augmenter légèrement le facteur de base
  if (Math.abs(difference) > 10000) {
    baseIncrementFactor *= 1.2;
  }
  
  // Calculer l'incrément avec une légère variation aléatoire
  const randomFactor = 0.85 + (Math.random() * 0.3); // 85% à 115% de l'incrément calculé
  const baseIncrement = Math.max(1, Math.ceil(Math.abs(difference) * baseIncrementFactor * randomFactor));
  
  // Limiter à un maximum raisonnable pour une progression réaliste
  // ~20 bots font ~20 vidéos/minute = 1 vidéo toutes les 3 secondes en moyenne
  const maxIncrement = isBoostMode ? 
    Math.min(3, Math.max(1, Math.floor(Math.abs(difference) / 1000))) : // Maximum 3 pour les bursts
    Math.min(1, Math.max(1, Math.floor(Math.abs(difference) / 2000)));  // Maximum 1 pour le mode normal
  
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
  
  // Forcer des mises à jour périodiques mais moins fréquentes et plus petites
  useEffect(() => {
    const handleForcedUpdate = () => {
      // Ajouter de petites progressions régulières plus réalistes
      setDisplayedAdsCount(prev => {
        if (Math.abs(prev - adsCount) < 1) return adsCount;
        // Réduit à des valeurs plus réalistes - 1 à 3 vidéos maximum
        const increment = 1 + Math.floor(Math.random() * 2);
        return Math.min(prev + increment, adsCount);
      });
      
      setDisplayedRevenueCount(prev => {
        if (Math.abs(prev - revenueCount) < 1) return revenueCount;
        // Réduit à des valeurs plus réalistes - petits gains par vidéo
        const increment = 0.30 + Math.floor(Math.random() * 300) / 100; // 0.30€ à 3.30€
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
    
    // Ralentir considérablement les animations pour une progression plus réaliste
    // Attendre plus longtemps entre les mises à jour (au moins 3 secondes en moyenne)
    if (elapsedTime < 2800 + Math.random() * 1000) {
      return { animationActive: true }; // Continuer l'animation sans changer les valeurs
    }
    
    // Mettre à jour le temps de la dernière mise à jour
    lastUpdateTime.current = now;
    
    // Réduire la fréquence des mises à jour pour une animation plus réaliste
    setUpdateSkipCounter(prev => {
      // Augmenter la probabilité de sauter des frames pour des animations moins fréquentes
      const shouldSkipFrame = Math.random() > 0.15;
      
      if (prev < 5 && shouldSkipFrame) {
        return prev + 1; // Sauter plus de frames
      }
      
      // Réduire la probabilité de "bursts" d'activité
      const isBurstMode = Math.random() > 0.96;
      
      // Animer le compteur d'annonces très lentement
      setDisplayedAdsCount((prevCount) => {
        // S'assurer que la valeur ne descend jamais sous zéro
        if (prevCount <= 0 && adsCount <= 0) return 0;
        
        // Si déjà à la valeur cible, ne pas changer
        if (Math.abs(prevCount - adsCount) < 1) return adsCount;
        
        // Simuler une vitesse de traitement beaucoup plus lente
        // Maximum 1-2 vidéos à la fois normalement
        const increment = isBurstMode 
          ? Math.min(3, calculateCounterIncrement(adsCount, prevCount))
          : Math.min(1, calculateCounterIncrement(adsCount, prevCount));
        
        // Si l'incrément est 0, ne pas changer la valeur
        if (increment === 0) return prevCount;
        
        // Calculer la nouvelle valeur avec une progression plus lente
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
        
        // Calculer un gain basé sur le prix moyen d'une publicité (0.30€-3.30€)
        // Pour une animation réaliste des revenus
        const adValue = isBurstMode
          ? (Math.random() * 1.3 + 2.0) // 2.00€-3.30€ pour pubs premium
          : (Math.random() * 0.5 + 0.3); // 0.30€-0.80€ pour pubs standard
        
        // Limiter l'incrément aux valeurs réalistes d'une seule publicité
        const increment = Math.min(adValue, Math.abs(revenueCount - prevCount));
        
        // Si l'incrément est trop petit, ne pas changer la valeur
        if (increment < 0.01) return prevCount;
        
        // Calculer la nouvelle valeur avec une progression plus réaliste
        const newValue = prevCount + (revenueCount > prevCount ? increment : -increment);
        
        // Garantir qu'on ne dépasse pas la cible (dans les deux directions)
        // Et s'assurer qu'on ne descend pas sous zéro
        const finalValue = revenueCount > prevCount
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
