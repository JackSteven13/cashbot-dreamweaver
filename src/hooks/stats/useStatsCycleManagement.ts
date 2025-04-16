
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
    // Réduire légèrement le taux pour ralentir la progression
    const baseHourlyRate = getTotalHourlyRate(activeLocations) * 0.95;
    let totalAdsIncrement = Math.floor((baseHourlyRate * timeDiff) / (3600 * 1000));
    let totalRevenue = 0;
    
    // Distribuer les annonces entre les emplacements et calculer les revenus
    activeLocations.forEach(location => {
      const locationShare = location.weight / activeLocations.reduce((sum, loc) => sum + loc.weight, 0);
      const locationAds = Math.floor(totalAdsIncrement * locationShare);
      
      // Vérifier l'activité de burst
      const burst = calculateBurstActivity(location);
      const finalAds = burst ? Math.floor(locationAds * burst.multiplier) : locationAds;
      
      totalRevenue += calculateRevenueForLocation(location, finalAds);
    });
    
    setAdsCount(prev => prev + totalAdsIncrement);
    setRevenueCount(prev => prev + totalRevenue);
    setLastUpdateTime(now);
  }, [lastUpdateTime, setAdsCount, setRevenueCount]);

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
