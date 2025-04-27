
import { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction } from '@/types/userData';
import { useTransactionsState } from './useTransactionsState';
import { useTransactionsStorage } from './useTransactionsStorage';
import { useTransactionsRefresh } from './useTransactionsRefresh';
import { useTransactionDisplay } from './useTransactionDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  
  const { user } = useAuth();
  
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
  
  // Fonction améliorée pour rafraîchir les transactions directement depuis la base de données
  const fetchTransactionsFromDB = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching transactions from DB:", error);
        return;
      }
      
      if (data && Array.isArray(data)) {
        const formattedTx = data.map((tx: any) => ({
          id: tx.id,
          date: tx.created_at || tx.date,
          amount: tx.gain,
          gain: tx.gain,
          report: tx.report,
          type: tx.type || 'system'
        }));
        
        setTransactions(formattedTx);
        setRefreshKey(Date.now());
        
        // Mettre à jour le cache local
        try {
          localStorage.setItem(transactionsCacheKey.current, JSON.stringify(formattedTx));
        } catch (e) {
          console.error("Failed to update cached transactions:", e);
        }
        
        // Déclencher un événement pour informer les autres composants
        window.dispatchEvent(new CustomEvent('transactions:updated', {
          detail: { transactions: formattedTx, timestamp: Date.now() }
        }));
      }
    } catch (error) {
      console.error("Failed to fetch transactions from database:", error);
    }
  }, [user, setTransactions, setRefreshKey, transactionsCacheKey]);
  
  // Mettre en place la synchronisation en temps réel
  useEffect(() => {
    if (!user?.id) return;
    
    // Écouter les événements Supabase pour les modifications de transactions
    const transactionChannel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          console.log('Transaction change detected in Supabase');
          fetchTransactionsFromDB();
        }
      )
      .subscribe();
      
    // Écouter les événements de l'application
    const refreshHandler = () => {
      console.log('Transaction refresh event received');
      fetchTransactionsFromDB();
    };
    
    window.addEventListener('transactions:refresh', refreshHandler);
    window.addEventListener('balance:update', refreshHandler);
    window.addEventListener('automatic:revenue', refreshHandler);
    window.addEventListener('transactions:updated', refreshHandler);
    
    // Rafraîchir immédiatement
    fetchTransactionsFromDB();
    
    // Rafraîchissement périodique
    const interval = setInterval(() => {
      fetchTransactionsFromDB();
    }, 30000);
    
    return () => {
      supabase.removeChannel(transactionChannel);
      window.removeEventListener('transactions:refresh', refreshHandler);
      window.removeEventListener('balance:update', refreshHandler);
      window.removeEventListener('automatic:revenue', refreshHandler);
      window.removeEventListener('transactions:updated', refreshHandler);
      clearInterval(interval);
    };
  }, [user, fetchTransactionsFromDB]);
  
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
    hiddenTransactionsCount,
    setTransactions, // Exposer cette fonction pour permettre des mises à jour directes
    fetchTransactionsFromDB // Exposer la fonction pour rafraîchir depuis la base de données
  };
};
