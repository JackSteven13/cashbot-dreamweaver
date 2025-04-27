
// Import specific functions from each file
import { 
  MINIMUM_ADS_COUNT, 
  MINIMUM_REVENUE_COUNT,
  MAX_ADS_COUNT,
  MAX_REVENUE_COUNT, 
  initializeFirstUseDate,
  DAILY_PROGRESSIVE_FACTOR
} from './valueInitializer';

import { 
  ensureProgressiveValues,
  enforceMinimumStats as enforceMinimumStatsSync,
  getDateConsistentStats as getDateConsistentStatsSync
} from './valueSynchronizer';

import { 
  loadStoredValues, 
  saveValues, 
  getDailyGains 
} from './storageOperations';

import { 
  incrementDateLinkedStats 
} from './statsIncrementer';

import { 
  getDaysDifference 
} from './dateUtils';

// Re-export with clear naming to avoid conflicts
export {
  // From valueInitializer
  MINIMUM_ADS_COUNT,
  MINIMUM_REVENUE_COUNT,
  MAX_ADS_COUNT,
  MAX_REVENUE_COUNT,
  DAILY_PROGRESSIVE_FACTOR,
  initializeFirstUseDate,
  
  // From valueSynchronizer
  ensureProgressiveValues,
  enforceMinimumStatsSync as enforceMinimumStats,
  getDateConsistentStatsSync as getDateConsistentStats,
  
  // From storageOperations
  loadStoredValues,
  saveValues,
  getDailyGains,
  
  // From statsIncrementer
  incrementDateLinkedStats,
  
  // From dateUtils
  getDaysDifference
};
