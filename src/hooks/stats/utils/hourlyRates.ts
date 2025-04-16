
import { LocationData, totalBotCount } from '../data/locationData';
import { adProcessingTime } from '../data/adConstants';

export const calculateHourlyRate = (location: LocationData): number => {
  const baseProcessingTime = adProcessingTime.standard.min; // Base processing time in ms
  const botsForLocation = location.botCount;
  
  // Calculate how many ads can be processed per hour per bot
  const adsPerHourPerBot = (3600 * 1000) / baseProcessingTime;
  
  // Apply location efficiency
  return Math.floor(adsPerHourPerBot * botsForLocation * location.efficiency);
};

export const getTotalHourlyRate = (locations: LocationData[]): number => {
  return locations.reduce((total, location) => total + calculateHourlyRate(location), 0);
};

