
import { useState, useCallback } from 'react';
import { activeLocations } from './data/locationData';
import { calculateRevenueForLocation } from './utils/revenueCalculator';
import { scheduleMidnightReset } from './utils/cycleManager';
import { getTotalHourlyRate } from './utils/hourlyRates';
import { calculateBurstActivity } from './utils/burstActivity';

interface UseStatsCycleManagementParams {
  setAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

// Clés pour le stockage local
const STORAGE_KEYS = {
  LAST_UPDATE_TIME: 'stats_last_update_time'
};

export const useStatsCycleManagement = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsCycleManagementParams) => {
  // Charger le dernier temps de mise à jour depuis localStorage ou utiliser le temps actuel
  const initialLastUpdateTime = (() => {
    const storedTime = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE_TIME);
    return storedTime ? parseInt(storedTime, 10) : Date.now();
  })();
  
  const [lastUpdateTime, setLastUpdateTime] = useState(initialLastUpdateTime);

  const incrementCountersRandomly = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastUpdateTime;
    
    // Sauvegarder le dernier temps de mise à jour dans localStorage
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, now.toString());
    
    // Calculer la base d'incrément basée sur les taux horaires
    // Réduire fortement le taux pour ralentir significativement la progression
    const baseHourlyRate = getTotalHourlyRate(activeLocations) * 0.40; // Réduit de 0.65 à 0.40
    let totalAdsIncrement = Math.floor((baseHourlyRate * timeDiff) / (3600 * 1000));
    let totalRevenue = 0;
    
    // Distribuer les annonces entre les emplacements et calculer les revenus
    activeLocations.forEach(location => {
      const locationShare = location.weight / activeLocations.reduce((sum, loc) => sum + loc.weight, 0);
      const locationAds = Math.floor(totalAdsIncrement * locationShare);
      
      // Vérifier l'activité de burst
      // Réduire encore plus la probabilité et l'intensité des bursts
      const burst = calculateBurstActivity(location);
      const finalAds = burst ? Math.floor(locationAds * (burst.multiplier * 0.5)) : locationAds; // Réduit l'effet du burst de 60% à 50%
      
      totalRevenue += calculateRevenueForLocation(location, finalAds);
    });
    
    // Ajouter une limitation supplémentaire pour éviter une croissance trop rapide
    const maxAdsPerUpdate = Math.min(1800, Math.ceil(dailyAdsTarget * 0.002)); // Max 0.2% de la cible quotidienne, réduit de 2500 à 1800
    const maxRevenuePerUpdate = Math.min(3500, Math.ceil(dailyRevenueTarget * 0.002)); // Max 0.2% de la cible quotidienne, réduit de 5000 à 3500
    
    const finalAdsIncrement = Math.min(totalAdsIncrement, maxAdsPerUpdate);
    const finalRevenueIncrement = Math.min(totalRevenue, maxRevenuePerUpdate);
    
    // S'assurer que les compteurs ne descendent jamais en dessous de zéro
    setAdsCount(prev => Math.max(0, prev + finalAdsIncrement));
    setRevenueCount(prev => Math.max(0, prev + finalRevenueIncrement));
    setLastUpdateTime(now);
  }, [lastUpdateTime, setAdsCount, setRevenueCount, dailyAdsTarget, dailyRevenueTarget]);

  const scheduleCycleUpdate = useCallback(() => {
    return scheduleMidnightReset(
      () => {
        setAdsCount(0);
        setRevenueCount(0);
        setDisplayedAdsCount(0);
        setDisplayedRevenueCount(0);
        
        // Effacer les valeurs stockées dans localStorage lors de la réinitialisation
        localStorage.removeItem('stats_ads_count');
        localStorage.removeItem('stats_revenue_count');
        localStorage.removeItem('displayed_ads_count');
        localStorage.removeItem('displayed_revenue_count');
      },
      dailyAdsTarget,
      dailyRevenueTarget
    );
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
