
import { useState } from 'react';
import { Transaction } from '@/types/userData';

/**
 * Hook pour gérer l'état des transactions
 */
export const useTransactionsState = () => {
  // États stables avec initialisation optimisée
  const [showAllTransactions, setShowAllTransactions] = useState(() => {
    try {
      const storedValue = localStorage.getItem('showAllTransactions');
      return storedValue === 'true';
    } catch {
      return false;
    }
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  return {
    transactions,
    setTransactions,
    showAllTransactions,
    setShowAllTransactions,
    refreshKey,
    setRefreshKey
  };
};

export default useTransactionsState;
