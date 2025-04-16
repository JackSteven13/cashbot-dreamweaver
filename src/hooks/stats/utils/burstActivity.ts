
import { LocationData } from '../data/locationData';
import { adProcessingTime, adValueCategories } from '../data/adConstants';

interface BurstConfig {
  probability: number;
  multiplier: number;
  duration: number;
}

const BURST_TYPES = {
  standard: { probability: 0.15, multiplier: 1.5, duration: 3000 },
  high: { probability: 0.08, multiplier: 2.0, duration: 2000 },
  premium: { probability: 0.05, multiplier: 2.5, duration: 1500 }
};

export const calculateBurstActivity = (location: LocationData): BurstConfig | null => {
  const rand = Math.random();
  
  // Check for premium ad burst first (rare but high value)
  if (rand < location.adTypes.premium * BURST_TYPES.premium.probability) {
    return BURST_TYPES.premium;
  }
  
  // Then high-value burst
  if (rand < location.adTypes.high * BURST_TYPES.high.probability) {
    return BURST_TYPES.high;
  }
  
  // Finally standard burst
  if (rand < BURST_TYPES.standard.probability) {
    return BURST_TYPES.standard;
  }
  
  return null;
};

