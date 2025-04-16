
import { useState, useCallback } from 'react';

interface UseStatsInitializationParams {
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

interface UseStatsInitializationResult {
  adsCount: number;
  revenueCount: number;
  displayedAdsCount: number;
  displayedRevenueCount: number;
  setAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  initializeCounters: () => void;
}

export const useStatsInitialization = ({
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsInitializationParams): UseStatsInitializationResult => {
  const [adsCount, setAdsCount] = useState<number>(0);
  const [revenueCount, setRevenueCount] = useState<number>(0);
  const [displayedAdsCount, setDisplayedAdsCount] = useState<number>(0);
  const [displayedRevenueCount, setDisplayedRevenueCount] = useState<number>(0);
  
  // Calculer la progression actuelle en fonction de l'heure du jour
  const calculateInitialValues = useCallback(() => {
    // Obtenir l'heure actuelle (0-23)
    const currentHour = new Date().getHours();
    
    // Au lieu d'avoir une valeur qui repart à 0 à minuit,
    // nous commençons avec des valeurs substantielles pour donner 
    // l'impression que le système fonctionne déjà depuis un moment
    
    // Base initiale (entre 40% et 50% de la cible quotidienne)
    const basePercentage = 0.4 + (Math.random() * 0.1);
    
    // Ajout d'une progression basée sur l'heure (jusqu'à 30% supplémentaires)
    let hourlyProgressPercent = 0;
    
    if (currentHour >= 8 && currentHour <= 23) {
      // Pendant la journée (8h-23h), progression plus rapide
      hourlyProgressPercent = (currentHour - 8) / 15 * 0.3;
    } else if (currentHour >= 0 && currentHour < 8) {
      // Pendant la nuit (0h-8h), progression plus lente
      hourlyProgressPercent = ((currentHour + 24 - 8) % 24) / 24 * 0.15;
    }
    
    // Pourcentage total (entre 40% et 80% selon l'heure)
    const totalPercentage = basePercentage + hourlyProgressPercent;
    
    // Variation aléatoire pour des valeurs réalistes (±2%)
    const finalPercentage = Math.min(0.85, totalPercentage + (Math.random() * 0.04 - 0.02));
    
    // Calculer les valeurs initiales
    const initialAds = Math.floor(dailyAdsTarget * finalPercentage);
    
    // Le revenu n'est pas exactement proportionnel aux annonces (légère variation)
    const revenueVariance = 0.97 + (Math.random() * 0.06); // 97% à 103%
    const initialRevenue = Math.floor(dailyRevenueTarget * finalPercentage * revenueVariance);
    
    // Définir les valeurs initiales (compteurs internes et affichés identiques au démarrage)
    setAdsCount(initialAds);
    setRevenueCount(initialRevenue);
    setDisplayedAdsCount(initialAds);
    setDisplayedRevenueCount(initialRevenue);
    
    console.log(`Initialized counters: Ads=${initialAds}, Revenue=${initialRevenue}`);
  }, [dailyAdsTarget, dailyRevenueTarget]);
  
  // Fonction pour initialiser les compteurs
  const initializeCounters = useCallback(() => {
    calculateInitialValues();
  }, [calculateInitialValues]);
  
  return {
    adsCount,
    revenueCount,
    displayedAdsCount,
    displayedRevenueCount,
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount,
    initializeCounters
  };
};
