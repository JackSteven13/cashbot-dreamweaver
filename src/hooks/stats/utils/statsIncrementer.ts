
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
  if (now - lastIncrementTimeRef.value < MIN_INCREMENT_INTERVAL) {
    console.log("Throttling stats increment - too soon since last update");
    const storedValues = loadStoredValues();
    
    // Update cache without triggering re-renders
    cachedResults.timestamp = now;
    cachedResults.adsCount = storedValues.adsCount;
    cachedResults.revenueCount = storedValues.revenueCount;
    
    return {
      newAdsCount: storedValues.adsCount,
      newRevenueCount: storedValues.revenueCount
    };
  }
  
  // Update last increment time
  lastIncrementTimeRef.value = now;
  
  try {
    const storedValues = loadStoredValues();
    
    // Base increment values with slight randomness (reduced magnitude)
    const adsIncrement = Math.floor(1 + Math.random() * 2); // 1-2 ads
    const revenueCoefficient = 0.76 + (Math.random() * 0.04); // ~0.76-0.80
    const revenueIncrement = adsIncrement * revenueCoefficient;
    
    // Calculate new values with upper limits
    const newAdsCount = Math.min(storedValues.adsCount + adsIncrement, 152847);
    const newRevenueCount = Math.min(storedValues.revenueCount + revenueIncrement, 116329);
    
    // Save the new values - but only if enough time has passed to prevent excessive writes
    if (now - cachedResults.timestamp > 30000) {
      try {
        saveValues(newAdsCount, newRevenueCount);
      } catch (e) {
        console.error("Failed to save new stat values:", e);
      }
    }
      
    // Update cache in any case
    cachedResults.timestamp = now;
    cachedResults.adsCount = newAdsCount;
    cachedResults.revenueCount = newRevenueCount;
    
    return {
      newAdsCount,
      newRevenueCount
    };
  } catch (error) {
    // Return the cached results if any error occurs
    console.error("Error in incrementDateLinkedStats:", error);
    return {
      newAdsCount: cachedResults.adsCount,
      newRevenueCount: cachedResults.revenueCount
    };
  }
};
