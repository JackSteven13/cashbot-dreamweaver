
import { useState, useEffect, useMemo, useRef } from 'react';
import { useStatsPersistence } from './useStatsPersistence';
import { useStatsAnimation } from './useStatsAnimation';
import { useStatsAutoUpdate } from './useStatsAutoUpdate';
import { getMinimumValues } from './utils/statsCalculator';
import { ensureProgressiveValues, getDateConsistentStats } from './utils/storageManager';

interface UseStatsCounterParams {
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

interface StatsCounterData {
  displayedAdsCount: number;
  displayedRevenueCount: number;
}

export const useStatsCounter = ({
  dailyAdsTarget = 15000,
  dailyRevenueTarget = 12000
}: UseStatsCounterParams): StatsCounterData => {
  // Get minimum values
  const minimumValues = useMemo(() => getMinimumValues(), []);
  const { ADS_COUNT: MINIMUM_ADS_COUNT, REVENUE_COUNT: MINIMUM_REVENUE_COUNT } = minimumValues;

  // Use custom hooks for different responsibilities
  const { adsCount, revenueCount, setAdsCount, setRevenueCount } = useStatsPersistence(
    MINIMUM_ADS_COUNT,
    MINIMUM_REVENUE_COUNT
  );

  const { displayedAdsCount, displayedRevenueCount, animateCounters } = useStatsAnimation(
    adsCount,
    revenueCount
  );

  // Setup auto-updates
  useStatsAutoUpdate({
    adsCount,
    revenueCount,
    setAdsCount,
    setRevenueCount,
    animateCounters
  });

  return {
    displayedAdsCount,
    displayedRevenueCount
  };
};

export default useStatsCounter;
