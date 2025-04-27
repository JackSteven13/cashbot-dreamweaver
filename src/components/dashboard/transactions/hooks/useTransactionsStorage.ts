
import { useRef, useCallback } from 'react';
import { Transaction } from '@/types/userData';
import { useAuth } from '@/hooks/useAuth';

export const useTransactionsStorage = () => {
  const { user } = useAuth();
  const userId = user?.id || '';
  
  // Create a unique cache key for this user
  const transactionsCacheKey = useRef<string>(`cachedTransactions_${userId}`);
  const initialFetchDone = useRef<boolean>(false);
  
  // Restore from cache
  const restoreFromCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(transactionsCacheKey.current);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error restoring transactions from cache:", e);
    }
    return [];
  }, [transactionsCacheKey]);
  
  return {
    transactionsCacheKey,
    initialFetchDone,
    restoreFromCache
  };
};

export default useTransactionsStorage;
