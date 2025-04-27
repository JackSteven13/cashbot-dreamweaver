
import { useState, useEffect } from 'react';
import { Transaction } from '@/types/userData';

export const useTransactionsState = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Read the saved value from localStorage only once during initialization
  const [showAllTransactions, setShowAllTransactions] = useState(() => {
    try {
      const storedValue = localStorage.getItem('showAllTransactions');
      return storedValue === 'true';
    } catch {
      return false;
    }
  });
  
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  // Save showAllTransactions preference when it changes
  useEffect(() => {
    try {
      localStorage.setItem('showAllTransactions', String(showAllTransactions));
    } catch (e) {
      console.error("Failed to save showAllTransactions preference:", e);
    }
  }, [showAllTransactions]);
  
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
