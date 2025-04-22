
import { useCallback, useState, useRef, useEffect } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

// Calculer un incrément microscopique pour une animation ultra-lente
const calculateCounterIncrement = (targetCount: number, currentCount: number): number => {
  // Différence entre la valeur cible et actuelle
  const difference = targetCount - currentCount;
  
  // Si la différence est quasi nulle, ne pas bouger du tout
  if (Math.abs(difference) < 0.2) return 0;
  
  // Protection absolue contre les différences négatives
  if (difference < -0.1 && targetCount > 0) {
    console.log("Différence négative détectée, mouvement ignoré", { targetCount, currentCount, difference });
    return 0; // Ne jamais autoriser de baisses
  }
  
  // Réduire drastiquement la probabilité d'un incrément (seulement 0.01% de chance)
  const shouldIncrement = Math.random() > 0.9999;
  
  // Aucun mouvement dans 99.99% des cas, sinon +1 maximum
  return shouldIncrement && difference > 0 ? 1 : 0;
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
  
  // Compteur pour supprimer presque toutes les mises à jour d'animation
  const [updateSkipCounter, setUpdateSkipCounter] = useState(0);
  
  // Référence pour l'heure de la dernière mise à jour autorisée
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
  
  // S'abonner strictement aux événements du feed de publicités
  useEffect(() => {
    const handleLocationAdded = (event: Event) => {
      // Ne rien faire ici - la synchronisation est gérée ailleurs
      // Cette fonction est maintenue pour compatibilité, mais n'effectue plus d'incréments automatiques
    };
    
    window.addEventListener('location:added', handleLocationAdded);
    return () => window.removeEventListener('location:added', handleLocationAdded);
  }, []);
  
  const animateCounters = useCallback((targetAdsCount?: number, targetRevenueCount?: number) => {
    // Calculer le temps écoulé depuis la dernière mise à jour
    const now = Date.now();
    const elapsedTime = now - lastUpdateTime.current;
    
    // Bloquer presque toutes les animations (attendre au moins 5-10 minutes entre chaque)
    if (elapsedTime < 300000 + Math.random() * 300000) {
      return { animationActive: false }; // Animation pratiquement gelée
    }
    
    // Mettre à jour le temps de la dernière mise à jour
    lastUpdateTime.current = now;
    
    // Sauter la quasi-totalité des updates (99.9%)
    setUpdateSkipCounter(prev => {
      const shouldSkipFrame = Math.random() > 0.001; // 0.1% de chance seulement de ne pas sauter
      
      if (shouldSkipFrame) {
        return prev + 1; // Accumuler les sauts
      }
      
      // Aucun burst d'activité autorisé
      const isBurstMode = false;
      
      // Animation complètement bloquée - changement extrêmement rare
      if (Math.random() > 0.999) { // 0.1% de chance de mise à jour
        setDisplayedAdsCount((prevCount) => {
          // Mettre à jour la valeur maximale si nécessaire
          if (prevCount > maxAdsCount.current) {
            maxAdsCount.current = prevCount;
            localStorage.setItem('max_ads_count', prevCount.toString());
          }
          
          // Maximum +1 vidéo à la fois, jamais plus
          return prevCount + 1;
        });

        // Animer le compteur de revenus avec un gain minuscule
        setDisplayedRevenueCount((prevCount) => {
          // Mettre à jour la valeur maximale si nécessaire
          if (prevCount > maxRevenueCount.current) {
            maxRevenueCount.current = prevCount;
            localStorage.setItem('max_revenue_count', prevCount.toString());
          }
          
          // Gain très faible correspondant à une seule vidéo
          const adValue = Math.random() * 0.1 + 0.2; // 0.2€-0.3€
          return prevCount + adValue;
        });
      }
      
      return 0; // Réinitialiser le compteur de sauts
    });

    // Animation presque toujours inactive
    return { 
      animationActive: Math.random() > 0.99
    };
  }, [setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
