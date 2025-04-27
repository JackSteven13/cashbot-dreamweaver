
import { loadStoredValues, saveValues } from './storageOperations';

// Track when last increment happened to avoid rapid fire updates
const lastIncrementTimeRef = { value: 0 };
const MIN_INCREMENT_INTERVAL = 15000; // 15 seconds minimum between increments

// Cache previous results to avoid recalculating on quick subsequent calls
const cachedResults = {
  timestamp: 0,
  adsCount: 0,
  revenueCount: 0
};

export const incrementDateLinkedStats = () => {
  // Check cache first if recent enough
  const now = Date.now();
  if (now - cachedResults.timestamp < MIN_INCREMENT_INTERVAL) {
    return {
      newAdsCount: cachedResults.adsCount,
      newRevenueCount: cachedResults.revenueCount
    };
  }
  
  // Prevent multiple calls in short succession with stronger throttling
  // If called too soon, return cached values without making changes
  if (now - lastIncrementTimeRef.value < MIN_INCREMENT_INTERVAL) {
    console.log("Throttling stats increment - too soon since last update");
    const storedValues = loadStoredValues();
    
    // Update cache
    cachedResults.timestamp = now;
    cachedResults.adsCount = storedValues.adsCount;
    cachedResults.revenueCount = storedValues.revenueCount;
    
    return {
      newAdsCount: storedValues.adsCount,
      newRevenueCount: storedValues.revenueCount
    };
  }
  
  lastIncrementTimeRef.value = now;
  const storedValues = loadStoredValues();
  
  // Base increment values with slight randomness
  const adsIncrement = Math.floor(1 + Math.random() * 3); // 1-3 ads
  const revenueCoefficient = 0.76 + (Math.random() * 0.06); // ~0.76-0.82
  const revenueIncrement = adsIncrement * revenueCoefficient;
  
  // Calculate new values
  const newAdsCount = Math.min(storedValues.adsCount + adsIncrement, 152847); // Respect max value
  const newRevenueCount = Math.min(storedValues.revenueCount + revenueIncrement, 116329); // Respect max value
  
  // Save the new values - throttled to prevent excessive writes
  if (now - cachedResults.timestamp > 10000) {
    saveValues(newAdsCount, newRevenueCount);
    
    // Update cache
    cachedResults.timestamp = now;
    cachedResults.adsCount = newAdsCount;
    cachedResults.revenueCount = newRevenueCount;
  } else {
    // Just update cache without writing to storage
    cachedResults.timestamp = now;
    cachedResults.adsCount = newAdsCount;
    cachedResults.revenueCount = newRevenueCount;
  }
  
  return {
    newAdsCount,
    newRevenueCount
  };
};
