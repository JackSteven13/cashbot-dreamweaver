
import { useState, useCallback, useEffect } from 'react';
import { loadStoredValues, saveValues } from './utils/storageManager';
import { calculateInitialValues } from './utils/valueCalculator';

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

// Fonction pour calculer les valeurs dynamiques avec progression lente
const getDynamicMinimumValues = () => {
  // Récupérer la date de première utilisation
  const firstUseDate = localStorage.getItem('first_use_date');
  if (!firstUseDate) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30); // Réduit à 30 jours (plus crédible)
    localStorage.setItem('first_use_date', pastDate.toISOString());
  }
  
  // Calculer le nombre de jours depuis l'installation
  const installDate = new Date(localStorage.getItem('first_use_date') || '');
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - installDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Facteur de progression très ralenti - croissance raisonnablement crédible
  const progressFactor = Math.min(1 + (diffDays * 0.002), 1.25); // Max 1.25x après 125 jours
  
  return {
    minAdsCount: Math.floor(35000 * progressFactor), // Valeurs de base réduites
    minRevenueCount: 25000 * progressFactor // Valeurs de base réduites
  };
};

export const useStatsInitialization = ({
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsInitializationParams): UseStatsInitializationResult => {
  // Utiliser des valeurs minimales dynamiques basées sur l'ancienneté
  const { minAdsCount, minRevenueCount } = getDynamicMinimumValues();
  
  const [adsCount, setAdsCount] = useState<number>(minAdsCount);
  const [revenueCount, setRevenueCount] = useState<number>(minRevenueCount);
  const [displayedAdsCount, setDisplayedAdsCount] = useState<number>(minAdsCount);
  const [displayedRevenueCount, setDisplayedRevenueCount] = useState<number>(minRevenueCount);
  const [lastResetDate, setLastResetDate] = useState<string>(() => {
    return localStorage.getItem('stats_last_reset_date') || new Date().toDateString();
  });
  const [initialized, setInitialized] = useState(false);
  
  const initializeCounters = useCallback(() => {
    if (initialized) return;
    
    const storedValues = loadStoredValues();
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
      localStorage.setItem('stats_last_reset_date', today);
      setLastResetDate(today);
    }
    
    if (storedValues.hasStoredValues) {
      console.log("Using stored values:", storedValues);
      
      // Garantir que les valeurs ne sont jamais inférieures aux minimums dynamiques
      const safeAds = Math.max(minAdsCount, storedValues.adsCount);
      const safeRevenue = Math.max(minRevenueCount, storedValues.revenueCount);
      
      // Plafonner à des valeurs crédibles
      const cappedAds = Math.min(safeAds, 180000);
      const cappedRevenue = Math.min(safeRevenue, 140000);
      
      setAdsCount(cappedAds);
      setRevenueCount(cappedRevenue);
      setDisplayedAdsCount(cappedAds);
      setDisplayedRevenueCount(cappedRevenue);
      setInitialized(true);
      
      // Sauvegarder les valeurs sécurisées
      saveValues(cappedAds, cappedRevenue);
      return;
    }
    
    // Si pas de valeurs stockées, calculer des valeurs initiales avec progression basée sur le temps
    const { initialAds, initialRevenue } = calculateInitialValues(dailyAdsTarget, dailyRevenueTarget);
    
    // Garantir des valeurs minimales mais raisonnables
    const safeAds = Math.min(Math.max(minAdsCount, initialAds), 180000);
    const safeRevenue = Math.min(Math.max(minRevenueCount, initialRevenue), 140000);
    
    setAdsCount(safeAds);
    setRevenueCount(safeRevenue);
    setDisplayedAdsCount(safeAds);
    setDisplayedRevenueCount(safeRevenue);
    setInitialized(true);
    
    saveValues(safeAds, safeRevenue);
    localStorage.setItem('stats_storage_date', today);
    
    console.log(`Initialized counters with values: Ads=${safeAds}, Revenue=${safeRevenue}`);
  }, [dailyAdsTarget, dailyRevenueTarget, lastResetDate, initialized, minAdsCount, minRevenueCount]);
  
  useEffect(() => {
    if (!initialized) {
      initializeCounters();
    }
  }, [initialized, initializeCounters]);
  
  useEffect(() => {
    const syncWithGlobalValues = () => {
      if (!initialized) return;
      
      const storedValues = loadStoredValues();
      
      if (storedValues.hasStoredValues) {
        // Vérifier s'il y a des valeurs plus élevées dans le stockage global
        const safeMinAdsCount = Math.max(minAdsCount, adsCount);
        const safeMinRevenueCount = Math.max(minRevenueCount, revenueCount);
        
        if (storedValues.adsCount > safeMinAdsCount) {
          setAdsCount(storedValues.adsCount);
          setDisplayedAdsCount(storedValues.adsCount);
        }
        
        if (storedValues.revenueCount > safeMinRevenueCount) {
          setRevenueCount(storedValues.revenueCount);
          setDisplayedRevenueCount(storedValues.revenueCount);
        }
      }
    };
    
    const syncInterval = setInterval(syncWithGlobalValues, 10000);
    return () => clearInterval(syncInterval);
  }, [adsCount, revenueCount, initialized, minAdsCount, minRevenueCount]);
  
  useEffect(() => {
    if (initialized && adsCount > 0 && revenueCount > 0) {
      // Lors de la sauvegarde, toujours garantir les valeurs minimales
      saveValues(
        Math.max(minAdsCount, adsCount),
        Math.max(minRevenueCount, revenueCount)
      );
      localStorage.setItem('stats_storage_date', new Date().toDateString());
    }
  }, [adsCount, revenueCount, initialized, minAdsCount, minRevenueCount]);
  
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
