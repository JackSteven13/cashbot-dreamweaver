
import { loadStoredValues, saveValues } from './storageOperations';

export const incrementDateLinkedStats = () => {
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
