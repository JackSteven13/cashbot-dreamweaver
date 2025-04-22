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
  
  // Ajout d'une variation aléatoire supplémentaire pour des incréments plus naturels
  const shouldIncrement = Math.random() > 0.9995; // Encore plus rare (0.05% de chance)
  
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
  
  // Compteur pour supprimer presque toutes les mises à jour d'animation
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
    
    // Bloquer presque toutes les animations (attendre au moins 8-15 minutes entre chaque)
    if (elapsedTime < 480000 + Math.random() * 420000) {
      return { animationActive: false }; // Animation pratiquement gelée
    }
    
    // Mettre à jour le temps de la dernière mise à jour avec légère variation
    lastUpdateTime.current = now - Math.floor(Math.random() * 10000); // Variation de 0-10s
    
    // Sauter la quasi-totalité des updates (99.95%)
    setUpdateSkipCounter(prev => {
      const shouldSkipFrame = Math.random() > 0.0005; // 0.05% de chance seulement de ne pas sauter
      
      if (shouldSkipFrame) {
        return prev + 1; // Accumuler les sauts
      }
      
      // Aucun burst d'activité autorisé
      const isBurstMode = false;
      
      // Animation complètement bloquée - changement extrêmement rare
      if (Math.random() > 0.998) { // 0.2% de chance de mise à jour
        setDisplayedAdsCount((prevCount) => {
          // Mettre à jour la valeur maximale si nécessaire
          if (prevCount > maxAdsCount.current) {
            maxAdsCount.current = prevCount;
            localStorage.setItem('max_ads_count', prevCount.toString());
          }
          
          // Incrément variable pour un aspect plus naturel et imprévisible
          const incrementAmount = Math.floor(Math.random() * 2) + 1;
          return prevCount + incrementAmount;
        });

        // Animer le compteur de revenus avec un gain minuscule et variable
        setDisplayedRevenueCount((prevCount) => {
          // Mettre à jour la valeur maximale si nécessaire
          if (prevCount > maxRevenueCount.current) {
            maxRevenueCount.current = prevCount;
            localStorage.setItem('max_revenue_count', prevCount.toString());
          }
          
          // Gain très faible correspondant à une seule vidéo avec variation
          const adValue = Math.random() * 0.08 + 0.22; // 0.22€-0.30€
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
