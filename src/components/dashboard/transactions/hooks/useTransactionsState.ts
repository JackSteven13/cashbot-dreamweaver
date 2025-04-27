
import { useState, useRef, useEffect } from 'react';
import { Transaction } from '@/types/userData';

export const useTransactionsState = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAllTransactions, setShowAllTransactions] = useState(() => {
    try {
      const storedValue = localStorage.getItem('showAllTransactions');
      return storedValue === 'true';
    } catch {
      return false;
    }
  });
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  // Listen for transaction update events to support real-time updates
  useEffect(() => {
    const handleTransactionRefresh = (event: any) => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('transactions:refresh', handleTransactionRefresh as any);
    window.addEventListener('balance:update', handleTransactionRefresh as any);
    
    return () => {
      window.removeEventListener('transactions:refresh', handleTransactionRefresh as any);
      window.removeEventListener('balance:update', handleTransactionRefresh as any);
    };
  }, []);
  
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
