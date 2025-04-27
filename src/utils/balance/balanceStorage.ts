
import { StorageKeys } from './types';

export const getStorageKeys = (userId: string | null): StorageKeys => ({
  currentBalance: userId ? `currentBalance_${userId}` : 'currentBalance',
  lastKnownBalance: userId ? `lastKnownBalance_${userId}` : 'lastKnownBalance',
  highestBalance: userId ? `highest_balance_${userId}` : 'highest_balance',
  dailyGains: userId ? `dailyGains_${userId}` : 'dailyGains'
});

export const persistBalance = (balance: number, userId: string | null): void => {
  try {
    const keys = getStorageKeys(userId);
    localStorage.setItem(keys.currentBalance, balance.toString());
    localStorage.setItem(keys.lastKnownBalance, balance.toString());
    sessionStorage.setItem(keys.currentBalance, balance.toString());
  } catch (e) {
    console.error('Failed to persist balance:', e);
  }
};

export const getPersistedBalance = (userId: string | null): number => {
  try {
    const keys = getStorageKeys(userId);
    const sources = [
      localStorage.getItem(keys.currentBalance),
      localStorage.getItem(keys.lastKnownBalance),
      sessionStorage.getItem(keys.currentBalance)
    ];
    
    const validBalances = sources
      .map(val => val ? parseFloat(val) : NaN)
      .filter(val => !isNaN(val));
      
    return validBalances.length > 0 ? Math.max(...validBalances) : 0;
  } catch (e) {
    console.error('Failed to get persisted balance:', e);
    return 0;
  }
};

// Clean up all data from other users
export const cleanOtherUserData = (currentUserId: string | null): void => {
  try {
    // Get all localStorage keys
    const allKeys = Object.keys(localStorage);
    
    // Filter keys that belong to other users
    allKeys.forEach(key => {
      // Check if this is a user-specific key (contains an ID that's not the current user's)
      if (key.includes('_') && key.split('_').length > 1) {
        // Extract the user ID from the key
        const keyParts = key.split('_');
        const keyUserId = keyParts[keyParts.length - 1];
        
        // If this is a user-specific key and not for the current user, remove it
        if (keyUserId !== currentUserId && keyUserId.length > 5) {
          localStorage.removeItem(key);
        }
      }
    });
    
    console.log('Cleaned other user data from localStorage');
  } catch (e) {
    console.error('Failed to clean other user data:', e);
  }
};

// Get all keys for a specific user
export const getUserSpecificKeys = (userId: string | null): string[] => {
  if (!userId) return [];
  
  try {
    // Get all localStorage keys
    const allKeys = Object.keys(localStorage);
    
    // Filter keys that belong to the specified user
    return allKeys.filter(key => 
      key.endsWith(`_${userId}`) || 
      key.includes(`_${userId}_`)
    );
  } catch (e) {
    console.error('Failed to get user-specific keys:', e);
    return [];
  }
};
