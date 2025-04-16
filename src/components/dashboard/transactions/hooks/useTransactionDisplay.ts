
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
  const { validTransactions, displayedTransactions, hiddenTransactionsCount, todayTransactions } = useMemo(() => {
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
    
    // Identifier les transactions d'aujourd'hui
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    const todayTx = validTx.filter(tx => {
      try {
        // Comparer les dates au format YYYY-MM-DD
        return tx.date && new Date(tx.date).toISOString().split('T')[0] === today;
      } catch (e) {
        return false;
      }
    });
    
    console.log(`Transactions d'aujourd'hui: ${todayTx.length}`, todayTx);
    
    return {
      validTransactions: validTx,
      displayedTransactions: displayedTx,
      hiddenTransactionsCount: hiddenCount,
      todayTransactions: todayTx
    };
  }, [transactions, showAllTransactions]);
  
  return {
    validTransactions,
    displayedTransactions,
    hiddenTransactionsCount,
    todayTransactions
  };
};

export default useTransactionDisplay;
