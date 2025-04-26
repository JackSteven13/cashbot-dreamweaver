
// Cache for localStorage values to reduce reads
const storageCache = new Map<string, string>();

// Lock mechanism to prevent race conditions
const writeLocks = new Set<string>();
const writeQueue = new Map<string, string>();

// Balance history to prevent unexpected decreases
const balanceHistory = new Map<string, number[]>();
const MAX_HISTORY_LENGTH = 10;

// Global maximum observed balance
let globalMaxBalance = -1;
let lastSavedBalance = -1;

// Debug mode for troubleshooting balance issues
const DEBUG_BALANCE = true;

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

// Track highest observed balance to prevent decreases
const trackBalanceHistory = (key: string, value: string): void => {
  if (key.includes('balance')) {
    try {
      const numValue = parseFloat(value);
      
      if (!isNaN(numValue) && numValue >= 0) {
        // Initialize history array if needed
        if (!balanceHistory.has(key)) {
          balanceHistory.set(key, []);
        }
        
        const history = balanceHistory.get(key) as number[];
        
        // Add to history and maintain max length
        history.push(numValue);
        if (history.length > MAX_HISTORY_LENGTH) {
          history.shift(); // Remove oldest value
        }
        
        // Update global maximum if this is higher
        if (numValue > globalMaxBalance) {
          globalMaxBalance = numValue;
          if (DEBUG_BALANCE) {
            console.log(`New highest balance observed: ${globalMaxBalance.toFixed(2)}`);
          }
        }
      }
    } catch (e) {
      console.error('Error tracking balance history:', e);
    }
  }
};

// Get highest stable balance from history
const getHighestStableBalance = (key: string): number => {
  if (!balanceHistory.has(key)) {
    return -1;
  }
  
  const history = balanceHistory.get(key) as number[];
  
  if (history.length === 0) {
    return -1;
  }
  
  // Sort and get values
  const sortedHistory = [...history].sort((a, b) => b - a);
  
  // If we have enough history, use second highest value for stability
  if (sortedHistory.length >= 3) {
    return sortedHistory[1]; // Second highest is more stable than absolute max
  }
  
  return sortedHistory[0]; // Otherwise use highest
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
    
    // Special handling for balance values to prevent fluctuation
    if (key.includes('balance') && previousValue) {
      const prevNum = parseFloat(previousValue);
      const newNum = parseFloat(safeValue);
      
      // Track history regardless of what happens next
      trackBalanceHistory(key, safeValue);
      
      // Get the highest stable balance for this key
      const highestStableBalance = getHighestStableBalance(key);
      
      // If we're trying to decrease the balance unexpectedly
      if (!isNaN(prevNum) && !isNaN(newNum) && newNum < prevNum) {
        // This is a significant decrease that doesn't match a known transaction
        const lastTransactionTime = parseInt(localStorage.getItem('lastTransactionTime') || '0');
        const now = Date.now();
        const recentTransaction = now - lastTransactionTime < 5000;
        
        // Handle balance decrease
        if (!recentTransaction) {
          if (DEBUG_BALANCE) {
            console.warn(`Blocking unexpected balance decrease: ${prevNum.toFixed(2)} → ${newNum.toFixed(2)}`);
          }
          
          // Enforce previous higher balance - NEVER let the balance drop unexpectedly
          // Release the lock and return without updating
          writeLocks.delete(key);
          
          // Calculate a restored value: use either global max, stable history, or previous value
          const restoredValue = Math.max(
            globalMaxBalance >= 0 ? globalMaxBalance : 0,
            highestStableBalance >= 0 ? highestStableBalance : 0,
            prevNum
          ).toString();
          
          if (DEBUG_BALANCE) {
            console.log(`Balance protection activated. Restored to: ${restoredValue}`);
          }
          
          // Force update the cache with the restored value and persist it
          storageCache.set(key, restoredValue);
          localStorage.setItem(key, restoredValue);
          
          // Create an emergency backup
          localStorage.setItem(`${key}_protected`, restoredValue);
          
          // Trigger a balance refresh event
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('balance:force-protect', {
              detail: {
                restoredValue: parseFloat(restoredValue),
                attemptedValue: newNum
              }
            }));
          }, 100);
          
          return;
        }
      }
    }
    
    // Update cache first
    storageCache.set(key, safeValue);
    
    // For crucial values like balance, use a try-catch with retry
    if (key.includes('balance')) {
      try {
        // Then persist to localStorage
        localStorage.setItem(key, safeValue);
        
        // Create backup copies for critical values
        localStorage.setItem(`${key}_backup`, safeValue);
        localStorage.setItem(`${key}_backup2`, safeValue); // Second backup
        
        // For balance values, update lastSavedBalance
        const numValue = parseFloat(safeValue);
        if (!isNaN(numValue)) {
          lastSavedBalance = numValue;
          
          // If this is the highest balance we've seen, save it separately
          if (numValue > parseFloat(localStorage.getItem('highest_balance') || '0')) {
            localStorage.setItem('highest_balance', safeValue);
          }
        }
        
      } catch (e) {
        console.error(`Failed localStorage write for ${key}, retrying:`, e);
        // Retry once
        setTimeout(() => {
          try {
            localStorage.setItem(key, safeValue);
            localStorage.setItem(`${key}_backup`, safeValue);
          } catch (retryError) {
            console.error('Second attempt failed:', retryError);
          }
        }, 100);
      }
    } else {
      // For non-critical values, persist without retry
      localStorage.setItem(key, safeValue);
    }
    
    // Log only significant value changes
    if ((key.includes('balance') || key.includes('dailyGains')) && typeof safeValue === 'string') {
      // Convert to number and format consistently
      const formattedValue = parseFloat(safeValue).toFixed(2);
      if (!previousValue || Math.abs(parseFloat(previousValue) - parseFloat(safeValue)) > 0.001) {
        if (DEBUG_BALANCE) {
          console.log(`Stored to localStorage: ${key}=${formattedValue}`);
        }
      }
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
    
    // If value is null or invalid, check all possible backups
    if (value === null || value === 'null' || value === 'undefined' || value === 'NaN') {
      // Check primary backup
      const backupKey = `${key}_backup`;
      const backupValue = localStorage.getItem(backupKey);
      
      if (backupValue !== null && backupValue !== 'null' && 
          backupValue !== 'undefined' && backupValue !== 'NaN') {
        if (DEBUG_BALANCE) {
          console.log(`Recovered ${key} from primary backup: ${backupValue}`);
        }
        value = backupValue;
      } else {
        // Check secondary backup
        const backupKey2 = `${key}_backup2`;
        const backupValue2 = localStorage.getItem(backupKey2);
        
        if (backupValue2 !== null && backupValue2 !== 'null' && 
            backupValue2 !== 'undefined' && backupValue2 !== 'NaN') {
          if (DEBUG_BALANCE) {
            console.log(`Recovered ${key} from secondary backup: ${backupValue2}`);
          }
          value = backupValue2;
        } else {
          // Check protected backup (from prevented decreases)
          const protectedKey = `${key}_protected`;
          const protectedValue = localStorage.getItem(protectedKey);
          
          if (protectedValue !== null) {
            if (DEBUG_BALANCE) {
              console.log(`Recovered ${key} from protected backup: ${protectedValue}`);
            }
            value = protectedValue;
          } else {
            // Check global highest balance for last resort balance recovery
            if (key.includes('balance') && globalMaxBalance > 0) {
              if (DEBUG_BALANCE) {
                console.log(`Recovered ${key} from global maximum: ${globalMaxBalance}`);
              }
              value = globalMaxBalance.toString();
            }
          }
        }
      }
    }
    
    // For balance values, ensure they're not negative and are consistent
    if ((key.includes('balance') || key.includes('dailyGains')) && value !== null) {
      try {
        const numValue = parseFloat(value);
        
        // Recovery if the value is invalid
        if (isNaN(numValue) || numValue < 0) {
          if (DEBUG_BALANCE) {
            console.warn(`Found invalid/negative value for ${key}: ${value}, using default`);
          }
          
          // Try to recover from highest known balance for balance keys
          if (key.includes('balance')) {
            const highestBalance = localStorage.getItem('highest_balance');
            if (highestBalance !== null) {
              const highestNum = parseFloat(highestBalance);
              if (!isNaN(highestNum) && highestNum > 0) {
                if (DEBUG_BALANCE) {
                  console.log(`Recovered from highest_balance: ${highestNum}`);
                }
                value = highestBalance;
              } else {
                value = defaultValue;
              }
            } else {
              value = defaultValue;
            }
          } else {
            value = defaultValue;
          }
        }
        
        // For balance keys, check if global max is higher and use that instead
        if (key.includes('balance') && globalMaxBalance > 0) {
          const currentValue = parseFloat(value);
          if (currentValue < globalMaxBalance) {
            if (DEBUG_BALANCE) {
              console.log(`Using global maximum (${globalMaxBalance}) instead of ${currentValue}`);
            }
            value = globalMaxBalance.toString();
          }
        }
        
      } catch (e) {
        value = defaultValue;
      }
    }
    
    // Update cache with the fetched value or default
    const result = value !== null ? value : defaultValue;
    storageCache.set(key, result);
    
    // Track balance history for this value if applicable
    if ((key.includes('balance') || key.includes('dailyGains'))) {
      trackBalanceHistory(key, result);
    }
    
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
          if (DEBUG_BALANCE) {
            console.warn(`Found invalid value during initialization for ${key}: ${value}`);
          }
          
          // Try backup
          const backupKey = `${key}_backup`;
          const backupValue = localStorage.getItem(backupKey);
          
          if (backupValue !== null) {
            const backupNum = parseFloat(backupValue);
            if (!isNaN(backupNum) && backupNum >= 0) {
              if (DEBUG_BALANCE) {
                console.log(`Recovered ${key} from backup during initialization: ${backupValue}`);
              }
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
        
        // For balance values, track in history and update global maximum
        if (key.includes('balance')) {
          trackBalanceHistory(key, value);
        }
      }
    } catch (e) {
      console.error(`Failed to preload ${key}:`, e);
    }
  }
  
  if (DEBUG_BALANCE) {
    console.log('Storage cache initialized with validated values');
  }
};

// Export function to repair inconsistent data
export const repairInconsistentData = (): void => {
  try {
    const userId = localStorage.getItem('current_user_id');
    
    // Get all balance-related values
    const balanceKeys = [
      'currentBalance',
      'lastKnownBalance',
      'highest_balance',
      userId ? `currentBalance_${userId}` : null,
      userId ? `lastKnownBalance_${userId}` : null,
      userId ? `highest_balance_${userId}` : null
    ].filter(Boolean) as string[];
    
    const balanceValues: number[] = [];
    const keyToValueMap = new Map<string, number>();
    
    // First pass: collect all valid values
    for (const key of balanceKeys) {
      // Check all possible sources for each key
      const sources = [
        localStorage.getItem(key),
        localStorage.getItem(`${key}_backup`),
        localStorage.getItem(`${key}_backup2`),
        localStorage.getItem(`${key}_protected`)
      ];
      
      for (const value of sources) {
        if (value !== null) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue >= 0) {
            balanceValues.push(numValue);
            // Store the highest valid value found for each key
            const currentMax = keyToValueMap.get(key) || 0;
            if (numValue > currentMax) {
              keyToValueMap.set(key, numValue);
            }
          }
        }
      }
    }
    
    if (balanceValues.length > 0) {
      // Find the highest consistent value
      balanceValues.sort((a, b) => b - a); // Sort in descending order
      
      // Use the maximum value to ensure users never lose balance
      const consistentBalance = balanceValues[0];
      
      if (DEBUG_BALANCE) {
        console.log(`Repairing inconsistent balance data to ${consistentBalance.toFixed(2)}`);
      }
      
      // Update global tracking
      globalMaxBalance = consistentBalance;
      
      // Update all balance values to the consistent value
      for (const key of balanceKeys) {
        persistToLocalStorage(key, consistentBalance.toString());
      }
      
      // Store as highest balance
      localStorage.setItem('highest_balance', consistentBalance.toString());
      
      // Trigger a balance update event
      window.dispatchEvent(new CustomEvent('balance:repaired', {
        detail: {
          newBalance: consistentBalance,
          timestamp: Date.now()
        }
      }));
    }
  } catch (e) {
    console.error('Failed to repair inconsistent data:', e);
  }
};

// Setup listeners for balance protection events
export const setupBalanceProtectionListeners = (): void => {
  window.addEventListener('balance:update', (event: any) => {
    const detail = event.detail;
    if (detail && typeof detail.amount === 'number') {
      // When a balance update occurs, ensure we update global tracking
      const currentBalance = parseFloat(getFromLocalStorage('currentBalance'));
      const newBalance = currentBalance + detail.amount;
      
      if (newBalance > globalMaxBalance) {
        globalMaxBalance = newBalance;
        if (DEBUG_BALANCE) {
          console.log(`Updated global maximum balance to: ${globalMaxBalance.toFixed(2)}`);
        }
      }
    }
  });
};

// Run initialization and setup
createStorageResetter();
initializeStorageCache();
repairInconsistentData();
setupBalanceProtectionListeners();

