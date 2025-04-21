
import { useMemo, useEffect, useState } from 'react';
import { Transaction } from '@/types/userData';

/**
 * Hook pour gérer l'affichage des transactions avec une meilleure gestion du rafraîchissement
 */
export const useTransactionDisplay = (
  transactions: Transaction[],
  showAllTransactions: boolean
) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Ecouter les événements de rafraîchissement des transactions
  useEffect(() => {
    const handleTransactionRefresh = (event: CustomEvent) => {
      console.log("Transaction refresh event detected");
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('transactions:refresh', handleTransactionRefresh as EventListener);
    window.addEventListener('balance:update', handleTransactionRefresh as EventListener);
    
    // Déclencher un rafraîchissement toutes les 15 secondes
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 15000);
    
    return () => {
      window.removeEventListener('transactions:refresh', handleTransactionRefresh as EventListener);
      window.removeEventListener('balance:update', handleTransactionRefresh as EventListener);
      clearInterval(interval);
    };
  }, []);
  
  // Memoize les résultats pour éviter les re-rendus inutiles
  const { validTransactions, displayedTransactions, hiddenTransactionsCount } = useMemo(() => {
    // Assurer que le tableau est bien défini
    if (!Array.isArray(transactions)) {
      console.error("Transactions is not an array:", transactions);
      return {
        validTransactions: [],
        displayedTransactions: [],
        hiddenTransactionsCount: 0
      };
    }
    
    // Ne traiter que les transactions valides
    const validTx = transactions.filter(tx => tx && (
      // Vérifier que tx.gain ou tx.amount est un nombre valide
      (typeof tx.gain === 'number' || typeof tx.amount === 'number') && 
      // Vérifier que tx.date existe
      tx.date
    ));
    
    // Trier les transactions par date, les plus récentes en premier
    const sortedTx = [...validTx].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Ordre décroissant (plus récent d'abord)
    });
    
    // Journaliser pour le débogage
    console.log(`Transactions valides après tri: ${sortedTx.length}/${transactions?.length || 0}`);
    
    // Déterminer les transactions à afficher
    const displayedTx = showAllTransactions ? sortedTx : sortedTx.slice(0, 5);
    
    // Calculer combien de transactions sont masquées
    const hiddenCount = sortedTx.length > 5 && !showAllTransactions ? 
      sortedTx.length - 5 : 0;
    
    return {
      validTransactions: sortedTx,
      displayedTransactions: displayedTx,
      hiddenTransactionsCount: hiddenCount
    };
  }, [transactions, showAllTransactions, refreshTrigger]);
  
  return {
    validTransactions,
    displayedTransactions,
    hiddenTransactionsCount,
    refreshTrigger
  };
};

export default useTransactionDisplay;
