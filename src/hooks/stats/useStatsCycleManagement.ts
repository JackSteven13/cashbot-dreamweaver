
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
  // Track pause periods for more natural progression
  const [isPaused, setIsPaused] = useState(false);

  const incrementCountersRandomly = useCallback(() => {
    // Natural pause periods - 15% chance of pausing updates for a cycle
    if (Math.random() < 0.15 && !isPaused) {
      setIsPaused(true);
      console.log("Natural pause in counter updates");
      
      // Schedule end of pause period
      setTimeout(() => {
        setIsPaused(false);
        console.log("Resuming counter updates after pause");
      }, 30000 + Math.random() * 90000); // 30s - 2m pause
      
      return; // Skip this update
    }
    
    // Skip update if in pause period
    if (isPaused) {
      return;
    }
    
    const now = Date.now();
    const timeDiff = now - lastUpdateTime;
    
    // Sauvegarder le dernier temps de mise à jour dans localStorage
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, now.toString());
    
    // Reduce hourly rate by 85% for much slower growth
    const baseHourlyRate = getTotalHourlyRate(activeLocations) * 0.15; // Only 15% of original rate
    
    // Calculate time-based progress with natural slowdown
    let totalAdsIncrement = Math.floor((baseHourlyRate * timeDiff) / (3600 * 1000));
    
    // Add natural time-of-day variation
    const hourOfDay = new Date().getHours();
    let timeOfDayFactor = 1.0;
    
    if (hourOfDay < 6) {
      // Overnight (midnight-6AM): very slow
      timeOfDayFactor = 0.2 + Math.random() * 0.3; // 20-50% speed
    } else if (hourOfDay < 9) {
      // Early morning (6-9AM): picking up 
      timeOfDayFactor = 0.6 + Math.random() * 0.3; // 60-90% speed
    } else if (hourOfDay < 12) {
      // Morning (9AM-noon): normal
      timeOfDayFactor = 0.9 + Math.random() * 0.2; // 90-110% speed
    } else if (hourOfDay < 15) {
      // Early afternoon (noon-3PM): peak activity
      timeOfDayFactor = 1.0 + Math.random() * 0.3; // 100-130% speed
    } else if (hourOfDay < 20) {
      // Late afternoon/evening (3-8PM): sustained activity
      timeOfDayFactor = 0.9 + Math.random() * 0.2; // 90-110% speed  
    } else {
      // Night (8PM-midnight): slowing down
      timeOfDayFactor = 0.6 + Math.random() * 0.3; // 60-90% speed
    }
    
    // Apply time of day factor
    totalAdsIncrement = Math.floor(totalAdsIncrement * timeOfDayFactor);
    
    // Occasional very slow periods (like system maintenance or low activity)
    if (Math.random() < 0.08) { // 8% chance
      totalAdsIncrement = Math.floor(totalAdsIncrement * (0.2 + Math.random() * 0.4)); // 20-60% speed
    }
    
    let totalRevenue = 0;
    
    // Distribuer les annonces entre les emplacements et calculer les revenus
    activeLocations.forEach(location => {
      const locationShare = location.weight / activeLocations.reduce((sum, loc) => sum + loc.weight, 0);
      const locationAds = Math.floor(totalAdsIncrement * locationShare);
      
      // Reduce burst probability and impact by 70%
      const burst = calculateBurstActivity(location);
      const finalAds = burst ? Math.floor(locationAds * (1 + (burst.multiplier - 1) * 0.3)) : locationAds;
      
      totalRevenue += calculateRevenueForLocation(location, finalAds);
    });
    
    // Severe limitation on growth per update 
    // Max 0.07% of daily target (instead of 0.2% previously)
    const maxAdsPerUpdate = Math.min(600, Math.ceil(dailyAdsTarget * 0.0007));
    const maxRevenuePerUpdate = Math.min(1200, Math.ceil(dailyRevenueTarget * 0.0007));
    
    const finalAdsIncrement = Math.min(totalAdsIncrement, maxAdsPerUpdate);
    const finalRevenueIncrement = Math.min(totalRevenue, maxRevenuePerUpdate);
    
    // Add natural variability - sometimes ads grow faster than revenue or vice versa
    const adjustedRevenueIncrement = Math.floor(finalRevenueIncrement * (0.85 + Math.random() * 0.3));
    
    // S'assurer que les compteurs ne descendent jamais en dessous de zéro
    setAdsCount(prev => Math.max(0, prev + finalAdsIncrement));
    setRevenueCount(prev => Math.max(0, prev + adjustedRevenueIncrement));
    setLastUpdateTime(now);
    
    // Small chance of minor visible update
    if (Math.random() < 0.3) { // 30% chance of small visible update
      const smallVisibleAdsUpdate = Math.floor(finalAdsIncrement * 0.1); // Only 10% of actual increment
      const smallVisibleRevenueUpdate = Math.floor(adjustedRevenueIncrement * 0.1);
      
      // Apply small direct updates to displayed values for more natural feeling of progress
      setDisplayedAdsCount(prev => Math.max(0, prev + smallVisibleAdsUpdate));
      setDisplayedRevenueCount(prev => Math.max(0, prev + smallVisibleRevenueUpdate));
    }
    
  }, [lastUpdateTime, setAdsCount, setRevenueCount, isPaused, setDisplayedAdsCount, setDisplayedRevenueCount, dailyAdsTarget, dailyRevenueTarget]);

  const scheduleCycleUpdate = useCallback(() => {
    return scheduleMidnightReset(
      () => {
        setAdsCount(0);
        setRevenueCount(0);
        setDisplayedAdsCount(0);
        setDisplayedRevenueCount(0);
        setIsPaused(false);
        
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
