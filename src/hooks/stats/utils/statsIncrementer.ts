
import { loadStoredValues, saveValues } from './storageOperations';

// Track when last increment happened to avoid rapid fire updates
const lastIncrementTimeRef = { value: 0 };
const MIN_INCREMENT_INTERVAL = 15000; // 15 seconds minimum between increments

export const incrementDateLinkedStats = () => {
  // Prevent multiple calls in short succession with stronger throttling
  const now = Date.now();
  
  // If called too soon, return current values without making changes
  if (now - lastIncrementTimeRef.value < MIN_INCREMENT_INTERVAL) {
    console.log("Throttling stats increment - too soon since last update");
    const storedValues = loadStoredValues();
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
  
  // Save the new values
  saveValues(newAdsCount, newRevenueCount);
  
  return {
    newAdsCount,
    newRevenueCount
  };
};
