
import { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction } from '@/types/userData';
import { useTransactionsState } from './useTransactionsState';
import { useTransactionsStorage } from './useTransactionsStorage';
import { useTransactionsRefresh } from './useTransactionsRefresh';
import { useTransactionDisplay } from './useTransactionDisplay';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';

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
  
  // Récupérer l'utilisateur
  const { user } = useAuth();
  
  // Utiliser le hook de stockage
  const { 
    transactionsCacheKey, 
    initialFetchDone,
    restoreFromCache
  } = useTransactionsStorage();
  
  // Utiliser le hook pour le rafraîchissement des transactions
  const { 
    handleManualRefresh: baseHandleManualRefresh, 
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
  
  // Version améliorée de handleManualRefresh qui force le refresh depuis la BD
  const handleManualRefresh = useCallback(async () => {
    if (!user?.id) {
      console.warn("Cannot refresh transactions: no user ID");
      return;
    }
    
    try {
      // Force un refresh en ignorant le cache
      const freshTransactions = await fetchUserTransactions(user.id, true);
      
      if (Array.isArray(freshTransactions)) {
        setTransactions(freshTransactions);
        setRefreshKey(Date.now());
        
        // Mettre à jour le cache avec les nouvelles transactions
        localStorage.setItem(transactionsCacheKey.current, JSON.stringify(freshTransactions));
        localStorage.setItem('transactionsLastRefresh', Date.now().toString());
        
        console.log(`Refreshed ${freshTransactions.length} transactions from DB`);
        
        // Déclencher des événements pour informer les autres composants
        window.dispatchEvent(new CustomEvent('transactions:updated', {
          detail: { timestamp: Date.now() }
        }));
      }
    } catch (error) {
      console.error("Error in handleManualRefresh:", error);
      throw error;
    }
  }, [user?.id, setTransactions, setRefreshKey, transactionsCacheKey]);
  
  // Refresh transactions when a balance update occurs
  useEffect(() => {
    const refreshOnBalanceUpdate = () => {
      console.log("Transaction refresh triggered by balance update");
      handleManualRefresh().catch(console.error);
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
