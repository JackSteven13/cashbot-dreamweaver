
import { saveValues, loadStoredValues } from './storageOperations';
import { MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT } from './valueInitializer';

// Cache to prevent excessive calculations
let lastEnsureTime = 0;
let lastEnsureResult = {
  adsCount: MINIMUM_ADS_COUNT,
  revenueCount: MINIMUM_REVENUE_COUNT
};

export const ensureProgressiveValues = () => {
  // Limit how often we perform this operation to prevent loops
  const now = Date.now();
  if (now - lastEnsureTime < 10000) { // Increased throttling to 10 seconds
    return lastEnsureResult;
  }
  
  lastEnsureTime = now;
  const storedValues = loadStoredValues();
  
  // Ensure values are at least minimum
  if (!storedValues.hasStoredValues || 
      storedValues.adsCount < MINIMUM_ADS_COUNT || 
      storedValues.revenueCount < MINIMUM_REVENUE_COUNT) {
    saveValues(MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT);
    lastEnsureResult = {
      adsCount: MINIMUM_ADS_COUNT,
      revenueCount: MINIMUM_REVENUE_COUNT
    };
  } else {
    lastEnsureResult = {
      adsCount: storedValues.adsCount,
      revenueCount: storedValues.revenueCount
    };
  }
  
  return lastEnsureResult;
};

// Cache for getDateConsistentStats results
let lastConsistentStats = {
  adsCount: MINIMUM_ADS_COUNT,
  revenueCount: MINIMUM_REVENUE_COUNT
};
let lastConsistentTime = 0;

export const getDateConsistentStats = () => {
  // Limit how often we access localStorage to prevent loops
  const now = Date.now();
  if (now - lastConsistentTime < 5000) { // Increased throttling to 5 seconds
    return lastConsistentStats;
  }
  
  lastConsistentTime = now;
  const stored = loadStoredValues();
  
  if (!stored.hasStoredValues) {
    lastConsistentStats = {
      adsCount: MINIMUM_ADS_COUNT,
      revenueCount: MINIMUM_REVENUE_COUNT
    };
  } else {
    lastConsistentStats = {
      adsCount: stored.adsCount,
      revenueCount: stored.revenueCount
    };
  }
  
  return lastConsistentStats;
};

// Throttled version of enforceMinimumStats
let lastEnforceTime = 0;

export const enforceMinimumStats = (minAds: number, minRevenue: number) => {
  // Throttle this operation to prevent loops
  const now = Date.now();
  if (now - lastEnforceTime < 30000) { // 30 seconds
    return;
  }
  
  lastEnforceTime = now;
  const stats = getDateConsistentStats();
  
  if (stats.adsCount < minAds || stats.revenueCount < minRevenue) {
    saveValues(
      Math.max(stats.adsCount, minAds),
      Math.max(stats.revenueCount, minRevenue)
    );
  }
};
