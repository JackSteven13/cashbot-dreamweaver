
import { saveValues, loadStoredValues } from './storageOperations';
import { MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT } from './valueInitializer';

export const ensureProgressiveValues = () => {
  const storedValues = loadStoredValues();
  
  // Ensure values are at least minimum
  if (!storedValues.hasStoredValues || 
      storedValues.adsCount < MINIMUM_ADS_COUNT || 
      storedValues.revenueCount < MINIMUM_REVENUE_COUNT) {
    saveValues(MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT);
  }
};

export const getDateConsistentStats = () => {
  const stored = loadStoredValues();
  if (!stored.hasStoredValues) {
    return {
      adsCount: MINIMUM_ADS_COUNT,
      revenueCount: MINIMUM_REVENUE_COUNT
    };
  }
  return {
    adsCount: stored.adsCount,
    revenueCount: stored.revenueCount
  };
};

export const enforceMinimumStats = (minAds: number, minRevenue: number) => {
  const stats = getDateConsistentStats();
  if (stats.adsCount < minAds || stats.revenueCount < minRevenue) {
    saveValues(
      Math.max(stats.adsCount, minAds),
      Math.max(stats.revenueCount, minRevenue)
    );
  }
};
