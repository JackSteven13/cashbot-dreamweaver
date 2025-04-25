
import { useState, useEffect, useRef } from 'react';
import { Transaction } from '@/types/userData';
import { useTransactionsState } from './useTransactionsState';
import { useTransactionsStorage } from './useTransactionsStorage';
import { useTransactionsRefresh } from './useTransactionsRefresh';
import { useTransactionDisplay } from './useTransactionDisplay';

export const useTransactions = (initialTransactions: Transaction[]) => {
  // Utiliser les hooks spécifiques pour chaque fonctionnalité
  const { 
    transactions, 
    setTransactions, 
    showAllTransactions, 
    setShowAllTransactions,
    refreshKey,
    setRefreshKey
  } = useTransactionsState();
  
  // Utiliser le hook de stockage
  const { 
    transactionsCacheKey, 
    initialFetchDone,
    restoreFromCache
  } = useTransactionsStorage();
  
  // Utiliser le hook pour le rafraîchissement des transactions
  const { 
    handleManualRefresh, 
    isMountedRef,
    throttleTimerRef
  } = useTransactionsRefresh(transactions, setTransactions, refreshKey, setRefreshKey);
  
  // Initialiser les transactions une seule fois
  useEffect(() => {
    if (!initialFetchDone.current && Array.isArray(initialTransactions)) {
      // Prioriser les transactions passées en props
      if (initialTransactions.length > 0) {
        setTransactions(initialTransactions);
        initialFetchDone.current = true;
        
        // Sauvegarder en cache seulement les transactions valides
        const validTx = initialTransactions.filter(tx => 
          tx && (typeof tx.gain === 'number' || typeof tx.amount === 'number') && tx.date
        );
        
        if (validTx.length > 0) {
          try {
            localStorage.setItem(transactionsCacheKey.current, JSON.stringify(validTx));
          } catch (e) {
            console.error("Failed to cache transactions:", e);
          }
        }
      } else {
        // Essayer de restaurer depuis le cache si aucune transaction initiale
        restoreFromCache();
      }
    }
    
    return () => {
      initialFetchDone.current = false;
    };
  }, [initialTransactions, setTransactions, transactionsCacheKey, restoreFromCache]);
  
  // Refresh transactions when a balance update occurs
  useEffect(() => {
    const refreshOnBalanceUpdate = () => {
      console.log("Transaction refresh triggered by balance update");
      handleManualRefresh();
    };
    
    window.addEventListener('balance:update', refreshOnBalanceUpdate);
    window.addEventListener('dashboard:micro-gain', refreshOnBalanceUpdate);
    window.addEventListener('automatic:revenue', refreshOnBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update', refreshOnBalanceUpdate);
      window.removeEventListener('dashboard:micro-gain', refreshOnBalanceUpdate);
      window.removeEventListener('automatic:revenue', refreshOnBalanceUpdate);
    };
  }, [handleManualRefresh]);
  
  // Sauvegarde des préférences utilisateur
  useEffect(() => {
    try {
      localStorage.setItem('showAllTransactions', showAllTransactions.toString());
    } catch (e) {
      console.error("Error saving showAllTransactions preference:", e);
    }
  }, [showAllTransactions]);
  
  // Calculer les transactions à afficher
  const { 
    validTransactions, 
    displayedTransactions, 
    hiddenTransactionsCount 
  } = useTransactionDisplay(transactions, showAllTransactions);
  
  return {
    showAllTransactions,
    setShowAllTransactions,
    validTransactions,
    displayedTransactions,
    refreshKey,
    handleManualRefresh,
    hiddenTransactionsCount
  };
};
