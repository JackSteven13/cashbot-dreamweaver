
import { LocationData } from '../data/locationData';
import { adProcessingTime, adValueCategories } from '../data/adConstants';

interface BurstConfig {
  probability: number;
  multiplier: number;
  duration: number;
}

const BURST_TYPES = {
  standard: { probability: 0.05, multiplier: 1.2, duration: 3000 },
  high: { probability: 0.02, multiplier: 1.5, duration: 2000 },
  premium: { probability: 0.01, multiplier: 1.8, duration: 1500 }
};

export const calculateBurstActivity = (location: LocationData): BurstConfig | null => {
  const rand = Math.random();
  
  // Vérifier d'abord le pic d'annonces premium (rare mais de haute valeur)
  if (rand < location.adTypes.premium * BURST_TYPES.premium.probability) {
    return BURST_TYPES.premium;
  }
  
  // Puis le pic de haute valeur
  if (rand < location.adTypes.high * BURST_TYPES.high.probability) {
    return BURST_TYPES.high;
  }
  
  // Enfin le pic standard
  if (rand < BURST_TYPES.standard.probability) {
    return BURST_TYPES.standard;
  }
  
  return null;
};
