
import { useMemo, useEffect, useState, useRef } from 'react';
import { Transaction } from '@/types/userData';

/**
 * Hook for managing transaction display with improved refresh handling
 */
export const useTransactionDisplay = (
  transactions: Transaction[],
  showAllTransactions: boolean
) => {
  // Use ref instead of state to avoid render loops
  const refreshTriggerRef = useRef(0);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Listen for transaction refresh events without causing re-renders
  useEffect(() => {
    const handleTransactionRefresh = () => {
      // Update the ref without causing a render
      refreshTriggerRef.current += 1;
      // Only update state occasionally to trigger re-renders
      setRefreshCounter(prev => prev + 1);
    };
    
    // Properly type the event handlers
    const typedHandler = handleTransactionRefresh as EventListener;
    
    window.addEventListener('transactions:refresh', typedHandler);
    window.addEventListener('balance:update', typedHandler);
    
    // Use a less frequent interval to avoid excessive renders
    const interval = setInterval(() => {
      refreshTriggerRef.current += 1;
      // Only update counter every 30 seconds to reduce re-renders
      setRefreshCounter(prev => prev + 1);
    }, 30000);
    
    return () => {
      window.removeEventListener('transactions:refresh', typedHandler);
      window.removeEventListener('balance:update', typedHandler);
      clearInterval(interval);
    };
  }, []); // No dependencies to avoid loops
  
  // Memoize results to avoid unnecessary re-renders
  const results = useMemo(() => {
    // Ensure transactions is an array
    if (!Array.isArray(transactions)) {
      console.error("Transactions is not an array:", transactions);
      return {
        validTransactions: [],
        displayedTransactions: [],
        hiddenTransactionsCount: 0
      };
    }
    
    // Filter valid transactions
    const validTx = transactions.filter(tx => tx && (
      (typeof tx.gain === 'number' || typeof tx.amount === 'number') && 
      tx.date
    ));
    
    // Sort transactions by date (most recent first)
    const sortedTx = [...validTx].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
    
    // Determine transactions to display
    const displayedTx = showAllTransactions ? sortedTx : sortedTx.slice(0, 5);
    
    // Calculate hidden transactions count
    const hiddenCount = sortedTx.length > 5 && !showAllTransactions ? 
      sortedTx.length - 5 : 0;
    
    return {
      validTransactions: sortedTx,
      displayedTransactions: displayedTx,
      hiddenTransactionsCount: hiddenCount,
      refreshCount: refreshTriggerRef.current
    };
  }, [transactions, showAllTransactions, refreshCounter]);
  
  return results;
};

export default useTransactionDisplay;
