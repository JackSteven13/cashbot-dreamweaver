
import { useMemo } from 'react';
import { Transaction } from '@/types/userData';

export const useTransactionDisplay = (
  transactions: Transaction[],
  showAllTransactions: boolean
) => {
  // Memoize results to avoid unnecessary re-renders
  const results = useMemo(() => {
    // Filter valid transactions
    const validTx = Array.isArray(transactions) ? 
      transactions.filter(tx => tx && (typeof tx.gain === 'number' || typeof tx.amount === 'number') && tx.date) : [];
    
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
      hiddenTransactionsCount: hiddenCount
    };
  }, [transactions, showAllTransactions]);
  
  return results;
};

export default useTransactionDisplay;
