
import { LocationData } from '../data/locationData';

export const getRandomAdTypeForLocation = (location: LocationData): string => {
  const adTypes = Object.entries(location.adTypes);
  let randomValue = Math.random();
  let cumulativeProbability = 0;
  
  for (const [type, probability] of adTypes) {
    cumulativeProbability += probability as number;
    if (randomValue <= cumulativeProbability) {
      return type;
    }
  }
  
  return 'standard'; // Fallback to standard if something goes wrong
};

