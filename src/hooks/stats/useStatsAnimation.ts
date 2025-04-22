
import { useCallback, useState, useRef, useEffect } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

// Fonction pour générer une croissance basée sur le temps qui s'est écoulé
const calculateTimeBasedGrowth = () => {
  // Récupérer la dernière date de génération des statistiques
  const lastStatsDate = localStorage.getItem('stats_last_generation');
  const now = new Date();
  const today = now.toDateString();
  
  // Date de référence pour les statistiques si pas de statistiques précédentes
  const baseDate = new Date('2023-01-01');
  const daysSinceBase = Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 3600 * 24));
  
  // Si c'est la première fois ou si c'est un nouveau jour
  if (!lastStatsDate || lastStatsDate !== today) {
    // Enregistrer la nouvelle date
    localStorage.setItem('stats_last_generation', today);
    localStorage.setItem('stats_last_sync_date', today);
    
    // Si nous avons une date précédente, calculer la croissance basée sur le temps écoulé
    if (lastStatsDate) {
      const lastDate = new Date(lastStatsDate);
      const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      
      // Calculer des taux de croissance journaliers réalistes
      // Minimum 1% de croissance par jour, maximum 3%
      return {
        adsGrowthFactor: 1 + (Math.random() * 0.02 + 0.01) * daysDiff,
        revenueGrowthFactor: 1 + (Math.random() * 0.02 + 0.01) * daysDiff
      };
    }
  }
  
  // Pas de croissance nécessaire
  return { adsGrowthFactor: 1, revenueGrowthFactor: 1 };
};

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
  
  // Augmenter la probabilité d'incrémenter (70% de chance)
  const shouldIncrement = Math.random() > 0.3;
  
  // Variation dans la taille des incréments pour un aspect plus naturel
  let incrementSize = 0;
  if (shouldIncrement && difference > 0) {
    // Incréments variables pour un aspect plus naturel
    if (difference > 10) {
      incrementSize = Math.floor(Math.random() * 5) + 1; // 1-5
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
  
  // Compteur pour réduire la fréquence des mises à jour d'animation
  const [updateSkipCounter, setUpdateSkipCounter] = useState(0);
  
  // Référence pour l'heure de la dernière mise à jour autorisée
  const lastUpdateTime = useRef<number>(Date.now());
  
  // Initialiser les valeurs maximales au montage du composant avec croissance basée sur le temps
  useEffect(() => {
    // Récupérer la date de dernière génération
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('stats_last_sync_date');
    
    // Récupérer les valeurs maximales du localStorage
    let storedMaxAds = localStorage.getItem('max_ads_count');
    let storedMaxRevenue = localStorage.getItem('max_revenue_count');
    
    // Si c'est un nouveau jour ou pas de valeurs stockées
    if (today !== lastDate || !storedMaxAds || !storedMaxRevenue) {
      // Déterminer le facteur de croissance depuis la dernière visite
      const { adsGrowthFactor, revenueGrowthFactor } = calculateTimeBasedGrowth();
      
      // Base plus réaliste avec légère variation (croissance constante)
      // Valeurs de base qui augmentent à chaque jour
      const baseAdsValue = 36742 + Math.floor(Math.random() * 2000);
      const baseRevenueValue = 23918 + Math.floor(Math.random() * 500);
      
      // Appliquer le facteur de croissance journalier
      const baseAds = Math.floor(baseAdsValue * adsGrowthFactor);
      const baseRevenue = Math.floor(baseRevenueValue * revenueGrowthFactor);
      
      // Mettre à jour les valeurs maximales
      maxAdsCount.current = baseAds;
      maxRevenueCount.current = baseRevenue;
      
      // Stocker les nouvelles valeurs
      localStorage.setItem('max_ads_count', baseAds.toString());
      localStorage.setItem('max_revenue_count', baseRevenue.toString());
      localStorage.setItem('stats_last_sync_date', today);
      
      // Mettre à jour les valeurs affichées
      setDisplayedAdsCount(baseAds);
      setDisplayedRevenueCount(baseRevenue);
    } else if (storedMaxAds && storedMaxRevenue) {
      // Même jour, charger les maxima avec légère croissance
      const parsedMaxAds = parseInt(storedMaxAds, 10);
      const parsedMaxRevenue = parseInt(storedMaxRevenue, 10);
      
      // Ajouter une légère croissance pour montrer de l'activité même le même jour
      const updatedAds = parsedMaxAds + Math.floor(Math.random() * 100) + 50;
      const updatedRevenue = parsedMaxRevenue + Math.floor(Math.random() * 30) + 10;
      
      maxAdsCount.current = updatedAds;
      maxRevenueCount.current = updatedRevenue;
      
      // Mettre à jour le stockage
      localStorage.setItem('max_ads_count', updatedAds.toString());
      localStorage.setItem('max_revenue_count', updatedRevenue.toString());
      
      // Mettre à jour les valeurs affichées
      setDisplayedAdsCount(updatedAds);
      setDisplayedRevenueCount(updatedRevenue);
    }
    
    // Ajouter un intervalle pour des mises à jour régulières même sans changement externe
    const regularUpdateInterval = setInterval(() => {
      // Simuler une mise à jour périodique même sans événement externe
      const minAdsIncrement = Math.floor(Math.random() * 5) + 2;
      const minRevenueIncrement = (Math.random() * 0.12 + 0.04);
      
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
    }, 6000 + Math.random() * 3000); // Toutes les 6-9 secondes
    
    return () => clearInterval(regularUpdateInterval);
  }, [setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // S'abonner aux événements du feed de publicités
  useEffect(() => {
    const handleLocationAdded = (event: Event) => {
      // Augmenter les compteurs à chaque événement d'annonce
      const adsIncrement = Math.floor(Math.random() * 8) + 4; // 4-11 ads par événement
      const revenueIncrement = Math.random() * 0.25 + 0.08; // 0.08€-0.33€ par événement
      
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
    
    // Limiter les mises à jour mais moins restrictif qu'avant (au moins 15 secondes entre chaque)
    if (elapsedTime < 15000) {
      return { animationActive: false };
    }
    
    // Mettre à jour le temps de la dernière mise à jour avec légère variation
    lastUpdateTime.current = now - Math.floor(Math.random() * 3000); // Variation de 0-3s
    
    // Réduire le nombre de mises à jour sautées (50% de chances de mise à jour)
    setUpdateSkipCounter(prev => {
      const shouldSkipFrame = Math.random() > 0.5;
      
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
        const incrementAmount = Math.floor(Math.random() * 8) + 3; // 3-10
        return prevCount + incrementAmount;
      });

      setDisplayedRevenueCount((prevCount) => {
        // Mettre à jour la valeur maximale si nécessaire
        if (prevCount > maxRevenueCount.current) {
          maxRevenueCount.current = prevCount;
          localStorage.setItem('max_revenue_count', prevCount.toString());
        }
        
        // Gain réaliste correspondant à plusieurs vidéos
        const adValue = Math.random() * 0.25 + 0.15; // 0.15€-0.40€
        return prevCount + adValue;
      });
      
      return 0; // Réinitialiser le compteur de sauts
    });

    return { 
      animationActive: Math.random() > 0.1 // 90% de chance d'animation active
    };
  }, [setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
