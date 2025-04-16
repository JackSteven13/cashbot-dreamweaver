
import { useState, useCallback, useEffect } from 'react';

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

// Clés pour le stockage local
const STORAGE_KEYS = {
  ADS_COUNT: 'stats_ads_count',
  REVENUE_COUNT: 'stats_revenue_count',
  LAST_UPDATE: 'stats_last_update',
  RESET_DATE: 'stats_reset_date'
};

export const useStatsInitialization = ({
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsInitializationParams): UseStatsInitializationResult => {
  const [adsCount, setAdsCount] = useState<number>(0);
  const [revenueCount, setRevenueCount] = useState<number>(0);
  const [displayedAdsCount, setDisplayedAdsCount] = useState<number>(0);
  const [displayedRevenueCount, setDisplayedRevenueCount] = useState<number>(0);
  
  // Fonction pour récupérer les valeurs stockées dans localStorage
  const loadStoredValues = useCallback(() => {
    try {
      const storedAdsCount = localStorage.getItem(STORAGE_KEYS.ADS_COUNT);
      const storedRevenueCount = localStorage.getItem(STORAGE_KEYS.REVENUE_COUNT);
      const storedLastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
      const storedResetDate = localStorage.getItem(STORAGE_KEYS.RESET_DATE);
      
      const today = new Date().toDateString();
      
      // Vérifier si nous avons déjà fait une réinitialisation aujourd'hui
      if (storedResetDate !== today) {
        // Si la dernière réinitialisation n'était pas aujourd'hui, on peut procéder normalement
        return { hasStoredValues: false };
      }
      
      if (storedAdsCount && storedRevenueCount) {
        const parsedAdsCount = parseInt(storedAdsCount, 10);
        const parsedRevenueCount = parseInt(storedRevenueCount, 10);
        
        if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount)) {
          console.log(`Loaded stored values: Ads=${parsedAdsCount}, Revenue=${parsedRevenueCount}`);
          return {
            hasStoredValues: true,
            adsCount: parsedAdsCount,
            revenueCount: parsedRevenueCount,
            lastUpdate: storedLastUpdate ? parseInt(storedLastUpdate, 10) : Date.now()
          };
        }
      }
      return { hasStoredValues: false };
    } catch (e) {
      console.error("Error loading stored values:", e);
      return { hasStoredValues: false };
    }
  }, []);
  
  // Fonction pour sauvegarder les valeurs dans localStorage
  const saveValues = useCallback((ads: number, revenue: number) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADS_COUNT, ads.toString());
      localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, revenue.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.RESET_DATE, new Date().toDateString());
    } catch (e) {
      console.error("Error saving values to localStorage:", e);
    }
  }, []);
  
  // Calculer la progression actuelle en fonction de l'heure du jour
  const calculateInitialValues = useCallback(() => {
    // Vérifier d'abord si nous avons des valeurs stockées
    const storedValues = loadStoredValues();
    
    if (storedValues.hasStoredValues) {
      // Utiliser les valeurs stockées
      setAdsCount(storedValues.adsCount);
      setRevenueCount(storedValues.revenueCount);
      setDisplayedAdsCount(storedValues.adsCount);
      setDisplayedRevenueCount(storedValues.revenueCount);
      return;
    }
    
    // Si pas de valeurs stockées, calculer de nouvelles valeurs
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
    
    // Sauvegarder les valeurs initiales
    saveValues(initialAds, initialRevenue);
    
    console.log(`Initialized counters: Ads=${initialAds}, Revenue=${initialRevenue}`);
  }, [dailyAdsTarget, dailyRevenueTarget, loadStoredValues, saveValues]);
  
  // Fonction pour initialiser les compteurs
  const initializeCounters = useCallback(() => {
    calculateInitialValues();
  }, [calculateInitialValues]);
  
  // Effet pour mettre à jour le stockage local lorsque les compteurs changent
  useEffect(() => {
    if (adsCount > 0 && revenueCount > 0) {
      saveValues(adsCount, revenueCount);
    }
  }, [adsCount, revenueCount, saveValues]);
  
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
