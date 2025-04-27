
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
    
    // Determine transactions to display
    const displayedTx = showAllTransactions 
      ? validTx 
      : validTx.slice(0, 3);
    
    // Calculate how many transactions are hidden
    const hiddenCount = validTx.length > 3 && !showAllTransactions ? validTx.length - 3 : 0;
    
    return {
      validTransactions: validTx,
      displayedTransactions: displayedTx,
      hiddenTransactionsCount: hiddenCount
    };
  }, [transactions, showAllTransactions]);
  
  return results;
};

export default useTransactionDisplay;
