
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
  
  // Protection contre les différences négatives importantes (qui indiqueraient une réinitialisation)
  if (difference < -1000 && targetCount > 0) {
    console.log("Detected major negative difference, ignoring reset", { targetCount, currentCount, difference });
    return 0; // Ne pas autoriser de grandes baisses
  }
  
  // Probabilité d'un petit "boost" dans le traitement (comme si plusieurs bots finissaient en même temps)
  // Réduite à seulement 2% de chance
  const isBoostMode = Math.random() > 0.98;
  
  // Limiter fortement l'incrément à seulement 1-3 vidéos maximum
  return difference > 0 ? 
    Math.min(isBoostMode ? 3 : 1, Math.max(1, Math.floor(Math.abs(difference) / 5000))) : 
    -Math.min(isBoostMode ? 3 : 1, Math.max(1, Math.floor(Math.abs(difference) / 5000)));
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
  
  // Protection contre la redescente - Garde les valeurs maximales atteintes
  const maxAdsCount = useRef(0);
  const maxRevenueCount = useRef(0);
  
  // Compteur pour ralentir les mises à jour d'animation
  const [updateSkipCounter, setUpdateSkipCounter] = useState(0);
  
  // Référence pour l'heure de la dernière mise à jour
  const lastUpdateTime = useRef<number>(Date.now());
  
  // Initialiser les valeurs maximales au montage du composant
  useEffect(() => {
    // Récupérer les valeurs maximales du localStorage
    const storedMaxAds = localStorage.getItem('max_ads_count');
    const storedMaxRevenue = localStorage.getItem('max_revenue_count');
    
    // Ne réinitialiser les valeurs maximales que si c'est un nouveau jour
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('stats_last_sync_date');
    
    if (today !== lastDate) {
      // Nouveau jour, réinitialiser
      maxAdsCount.current = 0;
      maxRevenueCount.current = 0;
    } else if (storedMaxAds && storedMaxRevenue) {
      // Même jour, charger les maxima
      maxAdsCount.current = parseInt(storedMaxAds, 10);
      maxRevenueCount.current = parseInt(storedMaxRevenue, 10);
    }
  }, []);
  
  // Forcer des mises à jour périodiques mais moins fréquentes et plus petites
  useEffect(() => {
    const handleForcedUpdate = () => {
      // Ajouter de petites progressions plus réalistes (maximum 1-3 vidéos)
      setDisplayedAdsCount(prev => {
        // Ne jamais descendre en dessous de la valeur maximale atteinte
        if (prev > maxAdsCount.current) {
          maxAdsCount.current = prev;
          localStorage.setItem('max_ads_count', prev.toString());
        }
        
        // Si déjà à la valeur cible ou supérieur, ne pas changer
        if (Math.abs(prev - adsCount) < 1 || prev > adsCount) return prev;
        
        // Limiter strictement à 1-3 vidéos
        const increment = 1 + Math.floor(Math.random() * 2); // 1 à 3
        return Math.min(prev + increment, adsCount);
      });
      
      setDisplayedRevenueCount(prev => {
        // Ne jamais descendre en dessous de la valeur maximale atteinte
        if (prev > maxRevenueCount.current) {
          maxRevenueCount.current = prev;
          localStorage.setItem('max_revenue_count', prev.toString());
        }
        
        // Si déjà à la valeur cible ou supérieur, ne pas changer
        if (Math.abs(prev - revenueCount) < 1 || prev > revenueCount) return prev;
        
        // Petits gains par vidéo (0.20€ à 0.90€)
        const increment = 0.20 + Math.floor(Math.random() * 70) / 100;
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
    
    // Ralentir considérablement les animations (au moins 6 secondes entre chaque mise à jour)
    // pour une progression beaucoup plus réaliste et lente
    if (elapsedTime < 6000 + Math.random() * 4000) {
      return { animationActive: true }; // Continuer l'animation sans changer les valeurs
    }
    
    // Mettre à jour le temps de la dernière mise à jour
    lastUpdateTime.current = now;
    
    // Réduire drastiquement la fréquence des mises à jour
    setUpdateSkipCounter(prev => {
      // Augmenter fortement la probabilité de sauter des frames (85% de chance)
      const shouldSkipFrame = Math.random() > 0.15;
      
      if (prev < 10 && shouldSkipFrame) {
        return prev + 1; // Sauter plus de frames
      }
      
      // Réduire fortement la probabilité de "bursts" d'activité (seulement 4%)
      const isBurstMode = Math.random() > 0.96;
      
      // Animer le compteur d'annonces extrêmement lentement
      setDisplayedAdsCount((prevCount) => {
        // Mettre à jour la valeur maximale si nécessaire
        if (prevCount > maxAdsCount.current) {
          maxAdsCount.current = prevCount;
          localStorage.setItem('max_ads_count', prevCount.toString());
        }
        
        // S'assurer que la valeur ne descend jamais sous zéro
        if (prevCount <= 0 && adsCount <= 0) return 0;
        
        // Si déjà à la valeur cible, ne pas changer
        if (Math.abs(prevCount - adsCount) < 1) return adsCount;
        
        // Protection contre la redescente - ne jamais descendre
        if (adsCount < maxAdsCount.current) {
          console.log("Target ads count is less than max, maintaining max", { adsCount, maxAdsCount: maxAdsCount.current });
          return Math.max(prevCount, maxAdsCount.current);
        }
        
        // Limiter fortement - maximum 1 vidéo en mode normal, jusqu'à 3 en mode burst
        const increment = isBurstMode 
          ? Math.min(3, 1)  // Maximum 3 en mode burst
          : Math.min(1, 1); // Toujours 1 en mode normal
        
        // Si l'incrément est 0, ne pas changer la valeur
        if (increment === 0) return prevCount;
        
        // Calculer la nouvelle valeur avec une progression plus lente
        const newValue = prevCount + increment;
        
        // Garantir qu'on ne dépasse pas la cible
        const finalValue = Math.min(newValue, adsCount);
          
        // Stocker la valeur précédente pour la comparaison
        setPrevAdsCount(finalValue);
        
        return finalValue;
      });

      // Animer le compteur de revenus avec des gains réduits
      setDisplayedRevenueCount((prevCount) => {
        // Mettre à jour la valeur maximale si nécessaire
        if (prevCount > maxRevenueCount.current) {
          maxRevenueCount.current = prevCount;
          localStorage.setItem('max_revenue_count', prevCount.toString());
        }
        
        // S'assurer que la valeur ne descend jamais sous zéro
        if (prevCount <= 0 && revenueCount <= 0) return 0;
        
        // Si déjà à la valeur cible, ne pas changer
        if (Math.abs(prevCount - revenueCount) < 0.1) return revenueCount;
        
        // Protection contre la redescente - ne jamais descendre
        if (revenueCount < maxRevenueCount.current) {
          return Math.max(prevCount, maxRevenueCount.current);
        }
        
        // Calculer un gain basé sur le prix moyen d'une publicité (fortement réduit)
        // Valeurs plus réalistes: 0.20€-0.90€
        const adValue = isBurstMode
          ? (Math.random() * 0.5 + 0.4) // 0.40€-0.90€ pour pubs premium
          : (Math.random() * 0.3 + 0.2); // 0.20€-0.50€ pour pubs standard
        
        // Limiter l'incrément aux valeurs réalistes d'une seule publicité
        const increment = Math.min(adValue, Math.abs(revenueCount - prevCount));
        
        // Si l'incrément est trop petit, ne pas changer la valeur
        if (increment < 0.01) return prevCount;
        
        // Calculer la nouvelle valeur avec une progression plus réaliste
        const newValue = prevCount + (revenueCount > prevCount ? increment : -increment);
        
        // Garantir qu'on ne dépasse pas la cible
        const finalValue = revenueCount > prevCount
          ? Math.min(newValue, revenueCount)
          : Math.max(Math.max(newValue, revenueCount), Math.max(0, maxRevenueCount.current));
          
        // Stocker la valeur précédente pour la comparaison
        setPrevRevenueCount(finalValue);
        
        return finalValue;
      });
      
      return 0; // Réinitialiser le compteur
    });

    // Indiquer si l'animation est toujours active
    return { 
      animationActive: adsCount !== 0 && revenueCount !== 0 && 
                      (Math.abs(adsCount - prevAdsCount) > 1 || 
                       Math.abs(revenueCount - prevRevenueCount) > 0.1)
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount, prevAdsCount, prevRevenueCount]);

  return { animateCounters };
};
