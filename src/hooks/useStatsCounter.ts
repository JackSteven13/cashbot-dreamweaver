
import { useRef } from 'react';
import { getMinimumValues } from './stats/utils/minimumValuesCalculator';
import { useStatsInitialization } from './stats/useStatsInitialization';
import { useStatsAnimation } from './stats/useStatsAnimation';
import { useStatsCycleManagement } from '@/hooks/stats/useStatsCycleManagement';
import { UseStatsCounterParams, StatsCounterData, StableValuesRef } from './stats/types';
import { useVisibilitySync } from './stats/hooks/useVisibilitySync';
import { usePeriodicIncrement } from './stats/hooks/usePeriodicIncrement';
import { useValuePersistence } from './stats/hooks/useValuePersistence';

export const useStatsCounter = ({
  dailyAdsTarget = 15000,
  dailyRevenueTarget = 12000
}: UseStatsCounterParams): StatsCounterData => {
  // Récupérer les valeurs minimales dynamiques
  const { ADS_COUNT: MINIMUM_ADS_COUNT, REVENUE_COUNT: MINIMUM_REVENUE_COUNT } = getMinimumValues();
  
  // Utiliser useRef pour assurer la stabilité entre les rendus
  const stableValuesRef = useRef<StableValuesRef>({
    initialized: false,
    syncInProgress: false,
    lastAutoIncrementTime: Date.now(),
    lastLocationUpdateTime: Date.now(),
    baseValues: {
      adsCount: MINIMUM_ADS_COUNT,
      revenueCount: MINIMUM_REVENUE_COUNT
    }
  });

  const {
    adsCount,
    revenueCount,
    displayedAdsCount,
    displayedRevenueCount,
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount,
    initializeCounters
  } = useStatsInitialization({
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  const { animateCounters } = useStatsAnimation({
    adsCount,
    revenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount
  });
  
  const { scheduleCycleUpdate, incrementCountersRandomly } = useStatsCycleManagement({
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount,
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  // Use our new hooks for cleaner organization
  useVisibilitySync({
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount
  });
  
  usePeriodicIncrement({
    stableValuesRef,
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount,
    animateCounters
  });
  
  useValuePersistence({
    adsCount,
    revenueCount
  });

  return {
    displayedAdsCount,
    displayedRevenueCount
  };
};

export default useStatsCounter;
