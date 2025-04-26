
// Cache for localStorage values to reduce reads
const storageCache = new Map<string, string>();

// Lock mechanism to prevent race conditions
const writeLocks = new Set<string>();
const writeQueue = new Map<string, string>();

/**
 * Persistently stores a value in localStorage with error handling,
 * locking mechanism and caching to improve consistency
 */
export const persistToLocalStorage = (key: string, value: string): void => {
  try {
    // Check if there's a write lock
    if (writeLocks.has(key)) {
      // Queue the write for later processing
      writeQueue.set(key, value);
      return;
    }
    
    // Set a write lock
    writeLocks.add(key);
    
    // Update cache first
    storageCache.set(key, value);
    
    // Then persist to localStorage
    localStorage.setItem(key, value);
    
    // Log only significant value changes
    if ((key.includes('balance') || key.includes('dailyGains')) && typeof value === 'string') {
      // Convert to number and format consistently to avoid spurious logs
      const formattedValue = parseFloat(value).toFixed(2);
      console.log(`Stored to localStorage: ${key}=${formattedValue}`);
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
 * Retrieves a value from localStorage with error handling,
 * using cache first to improve performance and consistency
 */
export const getFromLocalStorage = (key: string, defaultValue: string = '0'): string => {
  try {
    // Check cache first
    if (storageCache.has(key)) {
      return storageCache.get(key) as string;
    }
    
    // If not in cache, try localStorage
    const value = localStorage.getItem(key);
    
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
 */
export const atomicUpdate = (key: string, updateFn: (currentValue: string) => string): void => {
  try {
    // Get the most current value (bypassing cache)
    const rawValue = localStorage.getItem(key);
    const currentValue = rawValue !== null ? rawValue : '0';
    
    // Apply the update function
    const newValue = updateFn(currentValue);
    
    // Store the new value
    persistToLocalStorage(key, newValue);
  } catch (e) {
    console.error(`Failed to perform atomic update for key ${key}:`, e);
  }
};

// Initialize cache for commonly used keys
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
  
  // Preload all keys
  for (const key of keysToPreload) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        storageCache.set(key, value);
      }
    } catch (e) {
      console.error(`Failed to preload ${key}:`, e);
    }
  }
};

// Initialize the cache and resetter
createStorageResetter();
initializeStorageCache();
