
import { useCallback, useState, useRef, useEffect } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

// Calculer un incrément pour une animation plus visible et fréquente
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
  
  // Augmenter la probabilité d'incrémenter (50% de chance)
  const shouldIncrement = Math.random() > 0.5;
  
  // Variation dans la taille des incréments pour un aspect plus naturel
  let incrementSize = 0;
  if (shouldIncrement && difference > 0) {
    // Incréments variables pour un aspect plus naturel
    if (difference > 10) {
      incrementSize = Math.floor(Math.random() * 3) + 1; // 1-3
    } else {
      incrementSize = 1;
    }
  }
  
  return incrementSize;
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
  
  // Compteur pour réduire la fréquence des mises à jour d'animation (mais pas autant qu'avant)
  const [updateSkipCounter, setUpdateSkipCounter] = useState(0);
  
  // Référence pour l'heure de la dernière mise à jour autorisée
  const lastUpdateTime = useRef<number>(Date.now());
  
  // Initialiser les valeurs maximales au montage du composant avec une légère variation
  useEffect(() => {
    // Récupérer les valeurs maximales du localStorage
    const storedMaxAds = localStorage.getItem('max_ads_count');
    const storedMaxRevenue = localStorage.getItem('max_revenue_count');
    
    // Ne réinitialiser les valeurs maximales que si c'est un nouveau jour
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('stats_last_sync_date');
    
    if (today !== lastDate) {
      // Nouveau jour, réinitialiser avec légère variation
      const baseAds = Math.floor(36742 * (0.98 + Math.random() * 0.04)); // ±2%
      const baseRevenue = Math.floor(23918 * (0.98 + Math.random() * 0.04)); // ±2%
      
      maxAdsCount.current = baseAds;
      maxRevenueCount.current = baseRevenue;
    } else if (storedMaxAds && storedMaxRevenue) {
      // Même jour, charger les maxima
      maxAdsCount.current = parseInt(storedMaxAds, 10);
      maxRevenueCount.current = parseInt(storedMaxRevenue, 10);
    }
    
    // Ajouter un intervalle pour des mises à jour régulières même sans changement externe
    const regularUpdateInterval = setInterval(() => {
      // Simuler une mise à jour périodique même sans événement externe
      const minAdsIncrement = Math.floor(Math.random() * 3) + 1;
      const minRevenueIncrement = (Math.random() * 0.06 + 0.02);
      
      setDisplayedAdsCount(prev => {
        // S'assurer que la valeur ne diminue jamais
        const newValue = Math.max(prev + minAdsIncrement, maxAdsCount.current);
        if (newValue > maxAdsCount.current) {
          maxAdsCount.current = newValue;
          localStorage.setItem('max_ads_count', newValue.toString());
        }
        return newValue;
      });
      
      setDisplayedRevenueCount(prev => {
        // S'assurer que la valeur ne diminue jamais
        const newValue = Math.max(prev + minRevenueIncrement, maxRevenueCount.current);
        if (newValue > maxRevenueCount.current) {
          maxRevenueCount.current = newValue;
          localStorage.setItem('max_revenue_count', newValue.toString());
        }
        return newValue;
      });
    }, 8000 + Math.random() * 4000); // Toutes les 8-12 secondes
    
    return () => clearInterval(regularUpdateInterval);
  }, [setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // S'abonner aux événements du feed de publicités
  useEffect(() => {
    const handleLocationAdded = (event: Event) => {
      // Augmenter les compteurs à chaque événement d'annonce
      const adsIncrement = Math.floor(Math.random() * 5) + 2; // 2-6 ads par événement
      const revenueIncrement = Math.random() * 0.15 + 0.05; // 0.05€-0.20€ par événement
      
      setDisplayedAdsCount(prev => {
        const newValue = prev + adsIncrement;
        if (newValue > maxAdsCount.current) {
          maxAdsCount.current = newValue;
          localStorage.setItem('max_ads_count', newValue.toString());
        }
        return newValue;
      });
      
      setDisplayedRevenueCount(prev => {
        const newValue = prev + revenueIncrement;
        if (newValue > maxRevenueCount.current) {
          maxRevenueCount.current = newValue;
          localStorage.setItem('max_revenue_count', newValue.toString());
        }
        return newValue;
      });
    };
    
    window.addEventListener('location:added', handleLocationAdded);
    return () => window.removeEventListener('location:added', handleLocationAdded);
  }, [setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  const animateCounters = useCallback((targetAdsCount?: number, targetRevenueCount?: number) => {
    // Calculer le temps écoulé depuis la dernière mise à jour
    const now = Date.now();
    const elapsedTime = now - lastUpdateTime.current;
    
    // Limiter les mises à jour mais pas autant qu'avant (au moins 30 secondes entre chaque)
    if (elapsedTime < 30000) {
      return { animationActive: false };
    }
    
    // Mettre à jour le temps de la dernière mise à jour avec légère variation
    lastUpdateTime.current = now - Math.floor(Math.random() * 5000); // Variation de 0-5s
    
    // Sauter certaines mises à jour mais moins qu'avant (20% de chance de mise à jour)
    setUpdateSkipCounter(prev => {
      const shouldSkipFrame = Math.random() > 0.2;
      
      if (shouldSkipFrame) {
        return prev + 1;
      }
      
      // Animation périodique pour montrer une activité constante
      setDisplayedAdsCount((prevCount) => {
        // Mettre à jour la valeur maximale si nécessaire
        if (prevCount > maxAdsCount.current) {
          maxAdsCount.current = prevCount;
          localStorage.setItem('max_ads_count', prevCount.toString());
        }
        
        // Incrément variable pour un aspect plus naturel
        const incrementAmount = Math.floor(Math.random() * 5) + 2; // 2-6
        return prevCount + incrementAmount;
      });

      setDisplayedRevenueCount((prevCount) => {
        // Mettre à jour la valeur maximale si nécessaire
        if (prevCount > maxRevenueCount.current) {
          maxRevenueCount.current = prevCount;
          localStorage.setItem('max_revenue_count', prevCount.toString());
        }
        
        // Gain réaliste correspondant à plusieurs vidéos
        const adValue = Math.random() * 0.15 + 0.10; // 0.10€-0.25€
        return prevCount + adValue;
      });
      
      return 0; // Réinitialiser le compteur de sauts
    });

    return { 
      animationActive: Math.random() > 0.2 // 80% de chance d'animation active
    };
  }, [setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
