
import { useMemo } from 'react';
import { Transaction } from '@/types/userData';

/**
 * Hook pour gérer l'affichage des transactions
 */
export const useTransactionDisplay = (
  transactions: Transaction[],
  showAllTransactions: boolean
) => {
  // Memoize les résultats pour éviter les re-rendus inutiles
  const { validTransactions, displayedTransactions, hiddenTransactionsCount } = useMemo(() => {
    // Ne traiter que les transactions valides
    const validTx = Array.isArray(transactions) ? 
      transactions.filter(tx => tx && (
        // Vérifier que tx.gain ou tx.amount est un nombre valide
        (typeof tx.gain === 'number' || typeof tx.amount === 'number') && 
        // Vérifier que tx.date existe
        tx.date
      )) : [];
    
    // Journaliser pour le débogage
    console.log(`Transactions valides: ${validTx.length}/${transactions?.length || 0}`);
    
    // Déterminer les transactions à afficher
    const displayedTx = showAllTransactions ? validTx : validTx.slice(0, 5);
    
    // Calculer combien de transactions sont masquées
    const hiddenCount = validTx.length > 5 && !showAllTransactions ? 
      validTx.length - 5 : 0;
    
    return {
      validTransactions: validTx,
      displayedTransactions: displayedTx,
      hiddenTransactionsCount: hiddenCount
    };
  }, [transactions, showAllTransactions]);
  
  return {
    validTransactions,
    displayedTransactions,
    hiddenTransactionsCount
  };
};

export default useTransactionDisplay;
