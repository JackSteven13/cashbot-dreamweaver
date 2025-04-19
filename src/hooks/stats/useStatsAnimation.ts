
import { useCallback, useState, useRef, useEffect } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

// Calculer un incrément très minimal pour une animation extrêmement lente
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
  
  // Réduire encore plus la probabilité d'un "boost" (seulement 0.5% de chance)
  const isBoostMode = Math.random() > 0.995;
  
  // Limiter l'incrément à 1 vidéo maximum (exceptionnellement 2 en mode boost)
  return difference > 0 ? 
    Math.min(isBoostMode ? 2 : 1, 1) : 
    -Math.min(isBoostMode ? 2 : 1, 1);
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
  
  // Compteur pour ralentir encore plus les mises à jour d'animation
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
  
  // Forcer des mises à jour synchronisées avec le feed des publicités
  useEffect(() => {
    const handleLocationAdded = (event: Event) => {
      // Lors de l'ajout d'une nouvelle publicité dans le feed, incrémenter le compteur
      // mais après un délai pour simuler le traitement
      setTimeout(() => {
        setDisplayedAdsCount(prev => {
          // Ne jamais descendre en dessous de la valeur maximale atteinte
          if (prev > maxAdsCount.current) {
            maxAdsCount.current = prev;
            localStorage.setItem('max_ads_count', prev.toString());
          }
          
          // Toujours incrémenter de 1 exactement
          return prev + 1;
        });
        
        // Pour chaque vidéo, ajouter un montant fixe entre 0.25€ et 0.90€
        const adValue = 0.25 + Math.random() * 0.65;
        
        setDisplayedRevenueCount(prev => {
          // Ne jamais descendre en dessous de la valeur maximale atteinte
          if (prev > maxRevenueCount.current) {
            maxRevenueCount.current = prev;
            localStorage.setItem('max_revenue_count', prev.toString());
          }
          
          return prev + adValue;
        });
      }, 1000 + Math.random() * 2000); // Délai entre 1 et 3 secondes
    };
    
    window.addEventListener('location:added', handleLocationAdded);
    return () => window.removeEventListener('location:added', handleLocationAdded);
  }, []);
  
  const animateCounters = useCallback(() => {
    // Calculer le temps écoulé depuis la dernière mise à jour
    const now = Date.now();
    const elapsedTime = now - lastUpdateTime.current;
    
    // Ralentir drastiquement les animations (au moins 15 secondes entre chaque mise à jour)
    if (elapsedTime < 15000 + Math.random() * 10000) {
      return { animationActive: true }; // Continuer l'animation sans changer les valeurs
    }
    
    // Mettre à jour le temps de la dernière mise à jour
    lastUpdateTime.current = now;
    
    // Réduire encore plus la fréquence des mises à jour
    setUpdateSkipCounter(prev => {
      // Augmenter encore plus la probabilité de sauter des frames (95% de chance)
      const shouldSkipFrame = Math.random() > 0.05;
      
      if (prev < 20 && shouldSkipFrame) {
        return prev + 1; // Sauter beaucoup plus de frames
      }
      
      // Réduire encore la probabilité de "bursts" d'activité (seulement 1%)
      const isBurstMode = Math.random() > 0.99;
      
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
        
        // Maximum 1 seule vidéo à la fois, même en mode burst
        const increment = 1;
        
        // Calculer la nouvelle valeur avec une progression extrêmement lente
        const newValue = prevCount + increment;
        
        // Garantir qu'on ne dépasse pas la cible
        const finalValue = Math.min(newValue, adsCount);
          
        // Stocker la valeur précédente pour la comparaison
        setPrevAdsCount(finalValue);
        
        return finalValue;
      });

      // Animer le compteur de revenus avec des gains très réduits
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
        
        // Gain très faible, correspond exactement à une vidéo
        const adValue = Math.random() * 0.45 + 0.25; // 0.25€-0.70€
        
        // Calculer la nouvelle valeur avec une progression beaucoup plus lente
        const newValue = prevCount + adValue;
        
        // Garantir qu'on ne dépasse pas la cible
        const finalValue = Math.min(newValue, revenueCount);
          
        // Stocker la valeur précédente pour la comparaison
        setPrevRevenueCount(finalValue);
        
        return finalValue;
      });
      
      return 0; // Réinitialiser le compteur
    });

    return { 
      animationActive: adsCount !== 0 && revenueCount !== 0 && 
                      (Math.abs(adsCount - prevAdsCount) > 1 || 
                       Math.abs(revenueCount - prevRevenueCount) > 0.1)
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount, prevAdsCount, prevRevenueCount]);

  return { animateCounters };
};
