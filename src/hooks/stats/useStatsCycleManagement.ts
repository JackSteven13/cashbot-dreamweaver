import { useState, useCallback, useEffect } from 'react';
import { activeLocations } from './data/locationData';
import { calculateRevenueForLocation } from './utils/revenueCalculator';
import { scheduleMidnightReset } from './utils/cycleManager';
import { getTotalHourlyRate } from './utils/hourlyRates';
import { calculateBurstActivity } from './utils/burstActivity';
import { 
  saveValues, 
  enforceMinimumStats, 
  incrementDateLinkedStats 
} from './utils/storageManager';

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
    
    // S'assurer périodiquement que les valeurs minimales sont respectées
    const minimumCheckInterval = setInterval(() => {
      enforceMinimumStats(40000, 50000);
    }, 120000);
    
    return () => {
      clearInterval(interval);
      clearInterval(minimumCheckInterval);
    };
  }, [continuousMode]);
  
  const incrementCountersRandomly = useCallback((forceUpdate = false) => {
    if (isPaused && !forceUpdate) return;
    
    const now = Date.now();
    const timeDiff = forceUpdate ? 60000 : now - lastUpdateTime;
    
    const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
    
    setAdsCount(newAdsCount);
    setRevenueCount(newRevenueCount);
    setDisplayedAdsCount(newAdsCount);
    setDisplayedRevenueCount(newRevenueCount);
    
    setLastUpdateTime(now);
    saveValues(newAdsCount, newRevenueCount, true);
    
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
          // Ne réinitialisons pas à 0, mais appliquons les valeurs minimales
          setAdsCount(prev => Math.max(40000, prev));
          setRevenueCount(prev => Math.max(50000, prev));
          setDisplayedAdsCount(prev => Math.max(40000, prev));
          setDisplayedRevenueCount(prev => Math.max(50000, prev));
          setIsPaused(false);
          
          // S'assurer que les valeurs minimales sont respectées dans le stockage
          enforceMinimumStats(40000, 50000);
        }
      },
      dailyAdsTarget,
      dailyRevenueTarget
    );
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount, lastResetDate, dailyAdsTarget, dailyRevenueTarget]);
  
  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
