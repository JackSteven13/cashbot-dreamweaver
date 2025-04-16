
import { LocationData, totalBotCount } from '../data/locationData';
import { adProcessingTime } from '../data/adConstants';

export const calculateHourlyRate = (location: LocationData): number => {
  const avgProcessingTime = 40000; // Moyenne de 40 secondes par pub
  const botsForLocation = location.botCount;
  
  // Une heure en millisecondes / temps moyen de traitement
  const adsPerHourPerBot = (3600 * 1000) / avgProcessingTime;
  
  // Environ 90 pubs par heure par bot
  return Math.floor(adsPerHourPerBot * botsForLocation * location.efficiency);
};

export const getTotalHourlyRate = (locations: LocationData[]): number => {
  // Limiter le nombre total de bots à 20
  const MAX_TOTAL_BOTS = 20;
  
  let totalRate = locations.reduce((total, location) => 
    total + calculateHourlyRate(location), 0
  );
  
  // Ajuster le taux en fonction du nombre réel de bots
  const adjustmentFactor = MAX_TOTAL_BOTS / totalBotCount;
  return Math.floor(totalRate * adjustmentFactor);
};

