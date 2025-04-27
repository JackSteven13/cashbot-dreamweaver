
import { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction } from '@/types/userData';
import { useTransactionsState } from './useTransactionsState';
import { useTransactionsStorage } from './useTransactionsStorage';
import { useTransactionDisplay } from './useTransactionDisplay';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';

export const useTransactions = (initialTransactions: Transaction[]) => {
  // Use the specific hooks for each functionality
  const { 
    transactions, 
    setTransactions, 
    showAllTransactions, 
    setShowAllTransactions,
    refreshKey,
    setRefreshKey
  } = useTransactionsState();
  
  // Get the user
  const { user } = useAuth();
  
  // Use the storage hook
  const { 
    transactionsCacheKey, 
    initialFetchDone,
    restoreFromCache
  } = useTransactionsStorage();
  
  // Initialize transactions only once
  useEffect(() => {
    if (!initialFetchDone.current && Array.isArray(initialTransactions)) {
      // Prioritize transactions passed as props
      if (initialTransactions.length > 0) {
        setTransactions(initialTransactions);
        initialFetchDone.current = true;
        
        // Save valid transactions to cache
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
        // Try to restore from cache if no initial transactions
        const cachedTx = restoreFromCache();
        if (cachedTx.length > 0) {
          setTransactions(cachedTx);
        }
        initialFetchDone.current = true;
      }
    }
  }, [initialTransactions, setTransactions, transactionsCacheKey, initialFetchDone, restoreFromCache]);
  
  // Memoized refresh handler to avoid recreations
  const handleManualRefresh = useCallback(async () => {
    if (!user?.id) {
      console.warn("Cannot refresh transactions: no user ID");
      return Promise.resolve();
    }
    
    try {
      // Force a refresh by ignoring the cache
      const freshTransactions = await fetchUserTransactions(user.id);
      
      if (Array.isArray(freshTransactions)) {
        setTransactions(freshTransactions);
        setRefreshKey(Date.now());
        
        // Update cache with new transactions
        localStorage.setItem(transactionsCacheKey.current, JSON.stringify(freshTransactions));
        localStorage.setItem('transactionsLastRefresh', Date.now().toString());
        
        console.log(`Refreshed ${freshTransactions.length} transactions from DB`);
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error in handleManualRefresh:", error);
      return Promise.reject(error);
    }
  }, [user?.id, setTransactions, setRefreshKey, transactionsCacheKey]);
  
  // Calculate which transactions to display
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

export default useTransactions;
