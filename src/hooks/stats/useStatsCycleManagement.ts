import { useState, useCallback, useEffect } from 'react';
import { activeLocations } from './data/locationData';
import { calculateRevenueForLocation } from './utils/revenueCalculator';
import { scheduleMidnightReset } from './utils/cycleManager';
import { getTotalHourlyRate } from './utils/hourlyRates';
import { calculateBurstActivity } from './utils/burstActivity';
import { saveValues } from './utils/storageManager';

interface UseStatsCycleManagementParams {
  setAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

const STORAGE_KEYS = {
  LAST_UPDATE_TIME: 'stats_last_update_time',
  LAST_RESET_DATE: 'stats_last_reset_date',
  LAST_INCREMENT_TIME: 'stats_last_increment_time',
  CONTINUOUS_MODE_ENABLED: 'stats_continuous_mode_enabled'
};

export const useStatsCycleManagement = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsCycleManagementParams) => {
  const initialLastUpdateTime = (() => {
    const storedTime = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE_TIME);
    return storedTime ? parseInt(storedTime, 10) : Date.now();
  })();
  
  const [lastUpdateTime, setLastUpdateTime] = useState(initialLastUpdateTime);
  const [lastResetDate, setLastResetDate] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE) || new Date().toDateString();
  });
  
  const [isPaused, setIsPaused] = useState(false);
  
  const [continuousMode, setContinuousMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CONTINUOUS_MODE_ENABLED);
    return stored !== null ? stored === 'true' : true;
  });
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTINUOUS_MODE_ENABLED, 'true');
    setContinuousMode(true);
  }, []);
  
  useEffect(() => {
    if (!continuousMode) return;
    
    const interval = setInterval(() => {
      incrementCountersRandomly();
    }, 10000);
    
    const watchdogInterval = setInterval(() => {
      const lastIncrementTime = localStorage.getItem(STORAGE_KEYS.LAST_INCREMENT_TIME);
      
      if (lastIncrementTime) {
        const now = Date.now();
        const lastTime = parseInt(lastIncrementTime, 10);
        const timeSinceLastIncrement = now - lastTime;
        
        if (timeSinceLastIncrement > 300000) {
          console.log("Watchdog: Forçage d'un incrément de compteurs après inactivité");
          incrementCountersRandomly(true);
        }
      } else {
        incrementCountersRandomly(true);
      }
    }, 60000);
    
    return () => {
      clearInterval(interval);
      clearInterval(watchdogInterval);
    };
  }, [continuousMode]);
  
  const incrementCountersRandomly = useCallback((forceUpdate = false) => {
    if (isPaused && !forceUpdate) {
      return;
    }
    
    if (Math.random() < 0.01 && !isPaused && !forceUpdate) {
      setIsPaused(true);
      console.log("Natural pause in counter updates");
      
      setTimeout(() => {
        setIsPaused(false);
        console.log("Resuming counter updates after pause");
      }, 5000 + Math.random() * 10000);
      
      return;
    }
    
    const now = Date.now();
    const timeDiff = forceUpdate ? 60000 : now - lastUpdateTime;
    
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, now.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_INCREMENT_TIME, now.toString());
    
    const baseHourlyRate = getTotalHourlyRate(activeLocations);
    
    const timeBasedIncrement = (baseHourlyRate * timeDiff) / (3600 * 1000);
    
    const variationFactor = 0.8 + Math.random() * 0.4;
    let totalAdsIncrement = Math.max(1, Math.floor(timeBasedIncrement * variationFactor));
    
    if (forceUpdate) {
      totalAdsIncrement = Math.max(totalAdsIncrement, 5);
    }
    
    totalAdsIncrement = Math.min(totalAdsIncrement, forceUpdate ? 15 : 5);
    totalAdsIncrement = Math.max(totalAdsIncrement, 1);
    
    let totalRevenue = 0;
    
    activeLocations.forEach(location => {
      const locationShare = location.weight / activeLocations.reduce((sum, loc) => sum + loc.weight, 0);
      const locationAds = Math.max(1, Math.floor(totalAdsIncrement * locationShare));
      
      totalRevenue += calculateRevenueForLocation(location, locationAds);
    });
    
    setAdsCount(prev => {
      const newValue = Math.max(0, prev + totalAdsIncrement);
      saveValues(newValue, 0, true);
      return newValue;
    });
    
    setRevenueCount(prev => {
      const newValue = Math.max(0, prev + totalRevenue);
      saveValues(0, newValue, true);
      return newValue;
    });
    
    setLastUpdateTime(now);
    
    if (Math.random() < 0.4 || forceUpdate) {
      const visibleAdsUpdate = Math.ceil(totalAdsIncrement * 0.3);
      const visibleRevenueUpdate = totalRevenue * 0.3;
      
      setDisplayedAdsCount(prev => Math.max(0, prev + visibleAdsUpdate));
      setDisplayedRevenueCount(prev => Math.max(0, prev + visibleRevenueUpdate));
    }
  }, [lastUpdateTime, setAdsCount, setRevenueCount, isPaused, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  const scheduleCycleUpdate = useCallback(() => {
    const today = new Date().toDateString();
    if (today === lastResetDate) {
      console.log("Reset already happened today, skipping");
      return null;
    }
    
    localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
    setLastResetDate(today);
    
    return scheduleMidnightReset(
      () => {
        const resetDate = new Date().toDateString();
        localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, resetDate);
        setLastResetDate(resetDate);
        
        if (resetDate !== lastResetDate) {
          setAdsCount(0);
          setRevenueCount(0);
          setDisplayedAdsCount(0);
          setDisplayedRevenueCount(0);
          setIsPaused(false);
          
          localStorage.removeItem('stats_ads_count');
          localStorage.removeItem('stats_revenue_count');
          localStorage.removeItem('displayed_ads_count');
          localStorage.removeItem('displayed_revenue_count');
        }
      },
      dailyAdsTarget,
      dailyRevenueTarget
    );
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount, lastResetDate]);
  
  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
