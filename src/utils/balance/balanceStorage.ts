
import { BalanceStorageKeys } from './types';

export const getUserSpecificKeys = (userId: string): BalanceStorageKeys => ({
  currentBalance: `currentBalance_${userId}`,
  lastKnownBalance: `lastKnownBalance_${userId}`,
  lastUpdatedBalance: `lastUpdatedBalance_${userId}`,
  sessionCurrentBalance: `currentBalance_${userId}`
});

export const persistBalance = (balance: number, userId?: string): void => {
  try {
    if (userId) {
      const keys = getUserSpecificKeys(userId);
      Object.values(keys).forEach(key => {
        localStorage.setItem(key, balance.toString());
      });
    }
    // Toujours mettre à jour les clés génériques pour la compatibilité ascendante
    localStorage.setItem('currentBalance', balance.toString());
    localStorage.setItem('lastKnownBalance', balance.toString());
    localStorage.setItem('lastUpdatedBalance', balance.toString());
    sessionStorage.setItem('currentBalance', balance.toString());
  } catch (e) {
    console.error("Failed to persist balance:", e);
  }
};

export const getPersistedBalance = (userId?: string): number => {
  try {
    const sources = userId 
      ? Object.values(getUserSpecificKeys(userId)).map(key => localStorage.getItem(key))
      : [
          localStorage.getItem('currentBalance'),
          localStorage.getItem('lastKnownBalance'),
          localStorage.getItem('lastUpdatedBalance')
        ];

    const validBalances = sources
      .map(val => val ? parseFloat(val) : 0)
      .filter(num => !isNaN(num) && num > 0);

    return validBalances.length > 0 ? Math.max(...validBalances) : 0;
  } catch (e) {
    console.error("Failed to get persisted balance:", e);
    return 0;
  }
};
