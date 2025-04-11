
import { useMemo } from 'react';
import { Transaction } from '@/types/userData';

/**
 * Hook pour calculer l'affichage des transactions
 */
export const useTransactionDisplay = (
  transactions: Transaction[],
  showAllTransactions: boolean
) => {
  // Memoize les résultats pour éviter les re-rendus inutiles
  return useMemo(() => {
    // Ne traiter que les transactions valides
    const validTx = Array.isArray(transactions) ? 
      transactions.filter(tx => tx && (typeof tx.gain === 'number' || typeof tx.amount === 'number') && tx.date) : [];
    
    // Déterminer les transactions à afficher
    const displayedTx = showAllTransactions 
      ? validTx 
      : validTx.slice(0, 3);
    
    // Calculer combien de transactions sont masquées
    const hiddenCount = validTx.length > 3 && !showAllTransactions ? validTx.length - 3 : 0;
    
    return {
      validTransactions: validTx,
      displayedTransactions: displayedTx,
      hiddenTransactionsCount: hiddenCount
    };
  }, [transactions, showAllTransactions]);
};
