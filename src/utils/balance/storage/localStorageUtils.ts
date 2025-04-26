// Cache for localStorage values to reduce reads
const storageCache = new Map<string, string>();

// Lock mechanism to prevent race conditions
const writeLocks = new Set<string>();
const writeQueue = new Map<string, string>();

// Prevent negative values from being stored
const preventNegativeValues = (key: string, value: string): string => {
  // Only apply to balance-related keys
  if ((key.includes('balance') || key.includes('dailyGains')) && typeof value === 'string') {
    try {
      const numValue = parseFloat(value);
      // If it's a negative value, return "0" or the last known valid value
      if (isNaN(numValue) || numValue < 0) {
        console.warn(`Prevented storing negative/invalid value for ${key}: ${value}`);
        // Try to get last valid value from cache
        const lastValidValue = storageCache.get(key);
        return lastValidValue && parseFloat(lastValidValue) >= 0 ? lastValidValue : '0';
      }
    } catch (e) {
      // If parsing fails, return a safe value
      return '0';
    }
  }
  return value;
};

/**
 * Persistently stores a value in localStorage with error handling,
 * locking mechanism and caching to improve consistency
 */
export const persistToLocalStorage = (key: string, value: string): void => {
  try {
    // Safety check: prevent negative or invalid values for balances
    const safeValue = preventNegativeValues(key, value);
    
    // Check if there's a write lock
    if (writeLocks.has(key)) {
      // Queue the write for later processing
      writeQueue.set(key, safeValue);
      return;
    }
    
    // Set a write lock
    writeLocks.add(key);
    
    // Get previous value for comparison
    const previousValue = storageCache.get(key);
    
    // Check for suspicious changes (significant drops in balance)
    if (key.includes('balance') && previousValue) {
      const prevNum = parseFloat(previousValue);
      const newNum = parseFloat(safeValue);
      
      // If balance is dropping by more than 1%, log a warning and verify
      if (!isNaN(prevNum) && !isNaN(newNum) && newNum < prevNum && 
          (prevNum - newNum) / prevNum > 0.01) {
        console.warn(
          `Suspicious balance decrease detected: ${prevNum.toFixed(2)} -> ${newNum.toFixed(2)}. ` +
          `Decrease of ${(prevNum - newNum).toFixed(2)}`
        );
        
        // If the drop is very significant (more than 5%) without a corresponding transaction,
        // reject the update to prevent data corruption
        if ((prevNum - newNum) / prevNum > 0.05) {
          const lastTransactionTime = parseInt(localStorage.getItem('lastTransactionTime') || '0');
          const now = Date.now();
          
          // Only reject if there wasn't a recent transaction
          if (now - lastTransactionTime > 5000) {
            console.error(`Blocking suspicious balance decrease: ${prevNum.toFixed(2)} -> ${newNum.toFixed(2)}`);
            // Release the lock and return without updating
            writeLocks.delete(key);
            return;
          }
        }
      }
    }
    
    // Update cache first
    storageCache.set(key, safeValue);
    
    // Then persist to localStorage
    localStorage.setItem(key, safeValue);
    
    // Log only significant value changes
    if ((key.includes('balance') || key.includes('dailyGains')) && typeof safeValue === 'string') {
      // Convert to number and format consistently to avoid spurious logs
      const formattedValue = parseFloat(safeValue).toFixed(2);
      if (!previousValue || Math.abs(parseFloat(previousValue) - parseFloat(safeValue)) > 0.001) {
        console.log(`Stored to localStorage: ${key}=${formattedValue}`);
      }
    }
    
    // Create backup copies for critical values to prevent data loss
    if (key.includes('balance') || key.includes('dailyGains')) {
      const backupKey = `${key}_backup`;
      localStorage.setItem(backupKey, safeValue);
      storageCache.set(backupKey, safeValue);
    }
    
    // Process any queued writes after a short delay
    setTimeout(() => {
      // Release the lock
      writeLocks.delete(key);
      
      // Check if there's a queued write
      if (writeQueue.has(key)) {
        const queuedValue = writeQueue.get(key);
        writeQueue.delete(key);
        
        // Process the queued write if it exists
        if (queuedValue !== undefined) {
          persistToLocalStorage(key, queuedValue);
        }
      }
    }, 50);
  } catch (e) {
    console.error(`Failed to store value for key ${key}:`, e);
    // Release the lock on error
    writeLocks.delete(key);
  }
};

/**
 * Retrieves a value from localStorage with error handling and data validation,
 * using cache first to improve performance and consistency
 */
export const getFromLocalStorage = (key: string, defaultValue: string = '0'): string => {
  try {
    // Check cache first
    if (storageCache.has(key)) {
      return storageCache.get(key) as string;
    }
    
    // If not in cache, try localStorage
    let value = localStorage.getItem(key);
    
    // If value is null or invalid, check backup
    if (value === null || value === 'null' || value === 'undefined' || value === 'NaN') {
      const backupKey = `${key}_backup`;
      const backupValue = localStorage.getItem(backupKey);
      
      if (backupValue !== null && backupValue !== 'null' && 
          backupValue !== 'undefined' && backupValue !== 'NaN') {
        console.log(`Recovered ${key} from backup: ${backupValue}`);
        value = backupValue;
      }
    }
    
    // For balance values, ensure they're not negative
    if ((key.includes('balance') || key.includes('dailyGains')) && value !== null) {
      try {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          console.warn(`Found invalid/negative value for ${key}: ${value}, using default`);
          value = defaultValue;
        }
      } catch (e) {
        value = defaultValue;
      }
    }
    
    // Update cache with the fetched value or default
    const result = value !== null ? value : defaultValue;
    storageCache.set(key, result);
    
    return result;
  } catch (e) {
    console.error(`Failed to load value for key ${key}:`, e);
    return defaultValue;
  }
};

/**
 * Clears all cached values for a given user or all users
 */
export const clearLocalStorageCache = (userId: string | null = null): void => {
  if (userId) {
    // Clear only user-specific cache entries
    const userPrefix = `_${userId}`;
    for (const key of Array.from(storageCache.keys())) {
      if (key.includes(userPrefix)) {
        storageCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    storageCache.clear();
  }
};

/**
 * Creates a component that resets localStorage cache when the app is refreshed
 */
export const createStorageResetter = (): void => {
  window.addEventListener('beforeunload', () => {
    // Clear cache before page reload to force fresh reads on next load
    storageCache.clear();
  });
};

/**
 * Atomic update of a localStorage value - ensures we read the most current value
 * before updating it, preventing lost updates due to race conditions
 * 
 * @param key - The localStorage key to update
 * @param updateFn - Function that takes the current value and returns the new value
 * @returns boolean - Whether the update was successful
 */
export const atomicUpdate = (key: string, updateFn: (currentValue: string) => string): boolean => {
  try {
    // Get the most current value (bypass cache for crucial operations)
    const directValue = localStorage.getItem(key);
    const cachedValue = storageCache.get(key);
    
    // Use most reliable value source
    const currentValue = directValue !== null ? directValue : 
                         cachedValue !== undefined ? cachedValue : '0';
    
    // Apply the update function
    const newValue = updateFn(currentValue);
    
    // Validate the new value before storing
    if (key.includes('balance') || key.includes('dailyGains')) {
      const numValue = parseFloat(newValue);
      if (isNaN(numValue) || numValue < 0) {
        console.error(`Atomic update would result in invalid value for ${key}: ${newValue}`);
        return false;
      }
      
      // Check for suspicious changes
      const prevNum = parseFloat(currentValue);
      if (!isNaN(prevNum) && numValue < prevNum && 
          (prevNum - numValue) / prevNum > 0.05) {
        console.warn(`Suspicious balance decrease in atomic update: ${prevNum.toFixed(2)} -> ${numValue.toFixed(2)}`);
      }
    }
    
    // Store the new value
    persistToLocalStorage(key, newValue);
    return true;
  } catch (e) {
    console.error(`Failed to perform atomic update for key ${key}:`, e);
    return false;
  }
};

// Initialize cache for commonly used keys with data validation
export const initializeStorageCache = (userId: string | null = null): void => {
  const keysToPreload = [
    'dailyGains',
    'lastResetDate',
    'highest_balance',
    'currentBalance',
    'lastKnownBalance'
  ];
  
  // Add user-specific keys if a userId is provided
  if (userId) {
    keysToPreload.push(
      `dailyGains_${userId}`,
      `lastResetDate_${userId}`,
      `highest_balance_${userId}`,
      `currentBalance_${userId}`,
      `lastKnownBalance_${userId}`
    );
  }
  
  // Preload all keys and validate data
  for (const key of keysToPreload) {
    try {
      let value = localStorage.getItem(key);
      
      // For balance values, verify they're valid
      if ((key.includes('balance') || key.includes('dailyGains')) && value !== null) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          console.warn(`Found invalid value during initialization for ${key}: ${value}`);
          
          // Try backup
          const backupKey = `${key}_backup`;
          const backupValue = localStorage.getItem(backupKey);
          
          if (backupValue !== null) {
            const backupNum = parseFloat(backupValue);
            if (!isNaN(backupNum) && backupNum >= 0) {
              console.log(`Recovered ${key} from backup during initialization: ${backupValue}`);
              value = backupValue;
            } else {
              value = '0';
            }
          } else {
            value = '0';
          }
        }
      }
      
      if (value !== null) {
        storageCache.set(key, value);
        // Also ensure we have a backup
        if (key.includes('balance') || key.includes('dailyGains')) {
          localStorage.setItem(`${key}_backup`, value);
        }
      }
    } catch (e) {
      console.error(`Failed to preload ${key}:`, e);
    }
  }
  
  console.log('Storage cache initialized with validated values');
};

// Export function to repair inconsistent data
export const repairInconsistentData = (): void => {
  try {
    const userId = localStorage.getItem('current_user_id');
    
    // Get all balance-related values
    const balanceKeys = [
      'currentBalance',
      'lastKnownBalance',
      userId ? `currentBalance_${userId}` : null,
      userId ? `lastKnownBalance_${userId}` : null
    ].filter(Boolean) as string[];
    
    const balanceValues: number[] = [];
    
    for (const key of balanceKeys) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
          balanceValues.push(numValue);
        }
      }
      
      // Also check backups
      const backupKey = `${key}_backup`;
      const backupValue = localStorage.getItem(backupKey);
      if (backupValue !== null) {
        const numValue = parseFloat(backupValue);
        if (!isNaN(numValue) && numValue >= 0) {
          balanceValues.push(numValue);
        }
      }
    }
    
    if (balanceValues.length > 0) {
      // Use the most consistent value (median or maximum)
      balanceValues.sort((a, b) => a - b);
      let consistentBalance: number;
      
      // If we have multiple values, use the median for stability
      if (balanceValues.length > 2) {
        const mid = Math.floor(balanceValues.length / 2);
        consistentBalance = balanceValues[mid];
      } else {
        // Otherwise, use the maximum to ensure we don't lose funds
        consistentBalance = Math.max(...balanceValues);
      }
      
      // Update all balance values to the consistent value
      for (const key of balanceKeys) {
        persistToLocalStorage(key, consistentBalance.toString());
      }
      
      console.log(`Repaired inconsistent balance data to ${consistentBalance.toFixed(2)}`);
    }
  } catch (e) {
    console.error('Failed to repair inconsistent data:', e);
  }
};

// Run initialization and setup
createStorageResetter();
initializeStorageCache();
repairInconsistentData();
