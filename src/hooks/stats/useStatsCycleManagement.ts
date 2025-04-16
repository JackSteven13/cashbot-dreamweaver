
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

export const useStatsCycleManagement = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsCycleManagementParams) => {
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  const incrementCountersRandomly = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastUpdateTime;
    
    // Calculate base increment based on hourly rates
    const baseHourlyRate = getTotalHourlyRate(activeLocations);
    let totalAdsIncrement = Math.floor((baseHourlyRate * timeDiff) / (3600 * 1000));
    let totalRevenue = 0;
    
    // Distribute ads across locations and calculate revenue
    activeLocations.forEach(location => {
      const locationShare = location.weight / activeLocations.reduce((sum, loc) => sum + loc.weight, 0);
      const locationAds = Math.floor(totalAdsIncrement * locationShare);
      
      // Check for burst activity
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

