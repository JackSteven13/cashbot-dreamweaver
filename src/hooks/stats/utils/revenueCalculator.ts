
import { LocationData } from '../data/locationData';
import { adValueCategories } from '../data/adConstants';

export const calculateRevenueForLocation = (
  location: LocationData,
  ads: number
): number => {
  let totalRevenue = 0;
  const adTypes = Object.entries(location.adTypes);
  
  for (let i = 0; i < ads; i++) {
    // Determine ad category based on location distribution
    let adType = "standard";
    const randomValue = Math.random();
    let cumulativeProbability = 0;
    
    for (const [type, probability] of adTypes) {
      cumulativeProbability += probability as number;
      if (randomValue <= cumulativeProbability) {
        adType = type;
        break;
      }
    }
    
    // Calculate value based on ad type
    const category = adValueCategories[adType as keyof typeof adValueCategories];
    const adValue = category.min + Math.random() * (category.max - category.min);
    
    totalRevenue += adValue;
  }
  
  return totalRevenue;
};

