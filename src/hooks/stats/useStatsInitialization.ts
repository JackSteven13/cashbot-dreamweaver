
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
        
        if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && parsedAdsCount >= 0 && parsedRevenueCount >= 0) {
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
      // Garantir des valeurs positives avant de sauvegarder
      const safeAdsCount = Math.max(0, ads);
      const safeRevenueCount = Math.max(0, revenue);
      
      localStorage.setItem(STORAGE_KEYS.ADS_COUNT, safeAdsCount.toString());
      localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, safeRevenueCount.toString());
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
    
    // Valeur initiale minimale garantie (entre 50 et 150 pour les annonces)
    const minBaseAds = 50 + Math.floor(Math.random() * 100);
    // Valeur initiale minimale garantie (entre 80 et 200 pour les revenus)
    const minBaseRevenue = 80 + Math.floor(Math.random() * 120);
    
    // Base initiale (entre 10% et 15% de la cible quotidienne)
    // Pourcentage réduit pour une progression plus lente
    const basePercentage = 0.10 + (Math.random() * 0.05);
    
    // Ajout d'une progression basée sur l'heure (jusqu'à 20% supplémentaires)
    let hourlyProgressPercent = 0;
    
    if (currentHour >= 8 && currentHour <= 23) {
      // Pendant la journée (8h-23h), progression plus rapide
      hourlyProgressPercent = (currentHour - 8) / 15 * 0.20;
    } else if (currentHour >= 0 && currentHour < 8) {
      // Pendant la nuit (0h-8h), progression plus lente
      hourlyProgressPercent = ((currentHour + 24 - 8) % 24) / 24 * 0.10;
    }
    
    // Pourcentage total (entre 10% et 35% selon l'heure)
    const totalPercentage = basePercentage + hourlyProgressPercent;
    
    // Variation aléatoire pour des valeurs réalistes (±1%)
    const finalPercentage = Math.min(0.35, totalPercentage + (Math.random() * 0.02 - 0.01));
    
    // Calculer les valeurs initiales basées sur le pourcentage, mais avec un minimum garanti
    const calculatedAds = Math.floor(dailyAdsTarget * finalPercentage);
    const calculatedRevenue = Math.floor(dailyRevenueTarget * finalPercentage);
    
    // Utiliser la plus grande des deux valeurs : calculée ou minimale garantie
    const initialAds = Math.max(minBaseAds, calculatedAds);
    
    // Le revenu n'est pas exactement proportionnel aux annonces (légère variation)
    const revenueVariance = 0.97 + (Math.random() * 0.06); // 97% à 103%
    const calculatedRevenueWithVariance = Math.floor(calculatedRevenue * revenueVariance);
    const initialRevenue = Math.max(minBaseRevenue, calculatedRevenueWithVariance);
    
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
