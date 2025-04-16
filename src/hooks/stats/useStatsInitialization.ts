
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
    
    // Calculer quel pourcentage de la journée s'est écoulé
    // Utiliser une courbe plus naturelle avec moins d'activité la nuit
    let dayPercentage = 0;
    
    if (currentHour < 7) {
      // Entre minuit et 7h - progression très lente (nuit)
      dayPercentage = (currentHour / 24) * 0.15; // Max 15% à 7h
    } else if (currentHour >= 7 && currentHour < 23) {
      // Entre 7h et 23h - progression plus rapide (jour)
      const adjustedHour = currentHour - 7; // 0 à 16 heures
      const workingDayPercent = adjustedHour / 16; // 0% à 100% de la journée de travail
      
      // Pourcentage de base (ce qui a été réalisé pendant la nuit) plus progression de la journée
      dayPercentage = 0.15 + (workingDayPercent * 0.7); // De 15% à 85%
    } else {
      // Entre 23h et minuit - presque complet
      dayPercentage = 0.85;
    }
    
    // Ajouter une légère variation aléatoire (±3%)
    const randomVariation = (Math.random() * 0.06) - 0.03;
    dayPercentage = Math.max(0, Math.min(0.85, dayPercentage + randomVariation));
    
    // Pour rendre les valeurs plus stables et moins erratiques,
    // calculons des valeurs plus cohérentes au fil du temps
    
    // Appliquer une courbe progressive naturelle (non linéaire)
    // Utiliser une fonction qui accélère doucement puis ralentit en fin de journée
    const curvedPercentage = Math.sin(dayPercentage * Math.PI / 2);
    
    // Calculer les valeurs estimées sur la base du pourcentage
    const estimatedAds = Math.floor(dailyAdsTarget * curvedPercentage * 0.95); // Légèrement en dessous de la cible
    const estimatedRevenue = Math.floor(dailyRevenueTarget * curvedPercentage * 0.93);
    
    // Définir les compteurs
    setAdsCount(estimatedAds);
    setRevenueCount(estimatedRevenue);
    
    // Initialiser les valeurs affichées pour qu'elles correspondent à ce que nous avons calculé
    // Démarrer légèrement en dessous pour amorcer une animation douce
    setDisplayedAdsCount(Math.floor(estimatedAds * 0.985));
    setDisplayedRevenueCount(Math.floor(estimatedRevenue * 0.98));
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
