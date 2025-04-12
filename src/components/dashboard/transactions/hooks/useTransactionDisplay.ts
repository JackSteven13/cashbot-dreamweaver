
import { useMemo } from 'react';
import { Transaction } from '@/types/userData';

/**
 * Hook pour gérer l'affichage des transactions avec des fonctionnalités de filtrage
 */
export const useTransactionDisplay = (
  transactions: Transaction[],
  showAllTransactions: boolean,
  maxDisplayed: number = 5
) => {
  // Filtrer les transactions valides
  const validTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) {
      console.warn("Les transactions ne sont pas dans un tableau valide");
      return [];
    }
    
    return transactions.filter(tx => 
      tx && 
      (typeof tx.gain === 'number' || typeof tx.amount === 'number') && 
      tx.date
    );
  }, [transactions]);
  
  // Sélectionner les transactions à afficher en fonction de showAllTransactions
  const displayedTransactions = useMemo(() => {
    const transactionsToDisplay = showAllTransactions ? validTransactions : validTransactions.slice(0, maxDisplayed);
    
    // Vérifier si un message de réconciliation est nécessaire
    const hasBalanceReconciliationTx = transactionsToDisplay.some(tx => 
      tx.report === "Réconciliation de solde" || tx.type === "Réconciliation de solde"
    );
    
    return transactionsToDisplay;
  }, [validTransactions, showAllTransactions, maxDisplayed]);
  
  // Calculer le nombre de transactions masquées
  const hiddenTransactionsCount = validTransactions.length - displayedTransactions.length;
  
  return {
    validTransactions,
    displayedTransactions,
    hiddenTransactionsCount
  };
};
