
import { saveValues, loadStoredValues } from './storageOperations';
import { MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT } from './valueInitializer';

// Cache to prevent excessive calculations
const lastEnsureTimeRef = { value: 0 };
const lastEnsureResultRef = {
  value: {
    adsCount: MINIMUM_ADS_COUNT,
    revenueCount: MINIMUM_REVENUE_COUNT
  }
};

// Throttle for localStorage operations
const MIN_STORAGE_INTERVAL = 30000; // Increased to 30 seconds

export const ensureProgressiveValues = () => {
  // Limit how often we perform this operation to prevent loops
  const now = Date.now();
  if (now - lastEnsureTimeRef.value < MIN_STORAGE_INTERVAL) { 
    return lastEnsureResultRef.value;
  }
  
  lastEnsureTimeRef.value = now;
  
  try {
    const storedValues = loadStoredValues();
    
    // Ensure values are at least minimum
    if (!storedValues.hasStoredValues || 
        storedValues.adsCount < MINIMUM_ADS_COUNT || 
        storedValues.revenueCount < MINIMUM_REVENUE_COUNT) {
      
      // Only save if we're actually updating the values
      saveValues(MINIMUM_ADS_COUNT, MINIMUM_REVENUE_COUNT);
      
      lastEnsureResultRef.value = {
        adsCount: MINIMUM_ADS_COUNT,
        revenueCount: MINIMUM_REVENUE_COUNT
      };
    } else {
      lastEnsureResultRef.value = {
        adsCount: storedValues.adsCount,
        revenueCount: storedValues.revenueCount
      };
    }
    
    return lastEnsureResultRef.value;
  } catch (error) {
    console.error("Error in ensureProgressiveValues:", error);
    return lastEnsureResultRef.value;
  }
};

// Cache for getDateConsistentStats results
const lastConsistentStatsRef = {
  value: {
    adsCount: MINIMUM_ADS_COUNT,
    revenueCount: MINIMUM_REVENUE_COUNT
  }
};
const lastConsistentTimeRef = { value: 0 };

export const getDateConsistentStats = () => {
  // Limit how often we access localStorage to prevent loops
  const now = Date.now();
  if (now - lastConsistentTimeRef.value < 10000) { // Throttling to 10 seconds
    return lastConsistentStatsRef.value;
  }
  
  lastConsistentTimeRef.value = now;
  
  try {
    const stored = loadStoredValues();
    
    if (!stored.hasStoredValues) {
      lastConsistentStatsRef.value = {
        adsCount: MINIMUM_ADS_COUNT,
        revenueCount: MINIMUM_REVENUE_COUNT
      };
    } else {
      lastConsistentStatsRef.value = {
        adsCount: stored.adsCount,
        revenueCount: stored.revenueCount
      };
    }
    
    return lastConsistentStatsRef.value;
  } catch (error) {
    console.error("Error in getDateConsistentStats:", error);
    return lastConsistentStatsRef.value;
  }
};

// Throttled version of enforceMinimumStats
const lastEnforceTimeRef = { value: 0 };
const lastEnforceValues = {
  minAds: MINIMUM_ADS_COUNT,
  minRevenue: MINIMUM_REVENUE_COUNT
};

export const enforceMinimumStats = (minAds: number, minRevenue: number) => {
  // Skip if same values to prevent unnecessary operations
  if (minAds === lastEnforceValues.minAds && minRevenue === lastEnforceValues.minRevenue) {
    return;
  }
  
  // Throttle this operation heavily to prevent loops
  const now = Date.now();
  if (now - lastEnforceTimeRef.value < 60000) { // 60 seconds
    return;
  }
  
  lastEnforceTimeRef.value = now;
  lastEnforceValues.minAds = minAds;
  lastEnforceValues.minRevenue = minRevenue;
  
  try {
    const stats = getDateConsistentStats();
    
    if (stats.adsCount < minAds || stats.revenueCount < minRevenue) {
      saveValues(
        Math.max(stats.adsCount, minAds),
        Math.max(stats.revenueCount, minRevenue)
      );
    }
  } catch (error) {
    console.error("Error in enforceMinimumStats:", error);
  }
};
