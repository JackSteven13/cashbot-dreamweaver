
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
