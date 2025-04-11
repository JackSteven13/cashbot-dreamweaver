
import { useState, useEffect } from 'react';
import { Transaction } from '@/types/userData';
import { fetchUserTransactions } from '@/hooks/user/transactionUtils';
import { supabase } from '@/integrations/supabase/client';

export const useTransactions = (initialTransactions: Transaction[]) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setTransactions(initialTransactions);
    
    const handleTransactionRefresh = async (event: CustomEvent) => {
      const userId = event.detail?.userId;
      
      if (!userId) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id === userId) {
          console.log("Refreshing transactions for user:", userId);
          
          const updatedTransactions = await fetchUserTransactions(userId);
          if (updatedTransactions && updatedTransactions.length > 0) {
            setTransactions(updatedTransactions);
            setRefreshKey(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error("Error refreshing transactions:", error);
      }
    };
    
    const handleTransactionAdded = async (event: CustomEvent) => {
      const { userId, gain, report, date } = event.detail || {};
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id === userId) {
          console.log("New transaction added:", { gain, report });
          
          const newTransaction: Transaction = {
            id: `temp-${Date.now()}`,
            date,
            amount: gain,
            type: report,
            report,
            gain
          };
          
          setTransactions(prev => [newTransaction, ...prev]);
          
          setTimeout(async () => {
            const updatedTransactions = await fetchUserTransactions(userId);
            if (updatedTransactions && updatedTransactions.length > 0) {
              setTransactions(updatedTransactions);
              setRefreshKey(prev => prev + 1);
            }
          }, 500);
        }
      } catch (error) {
        console.error("Error handling transaction added:", error);
      }
    };
    
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const refreshedTransactions = await fetchUserTransactions(session.user.id);
          if (refreshedTransactions && refreshedTransactions.length > 0 && 
              JSON.stringify(refreshedTransactions) !== JSON.stringify(transactions)) {
            console.log("Auto-refreshing transactions");
            setTransactions(refreshedTransactions);
            setRefreshKey(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error("Error in refresh interval:", error);
      }
    }, 30000);
    
    window.addEventListener('transactions:refresh' as any, handleTransactionRefresh);
    window.addEventListener('transaction:added' as any, handleTransactionAdded);
    
    return () => {
      window.removeEventListener('transactions:refresh' as any, handleTransactionRefresh);
      window.removeEventListener('transaction:added' as any, handleTransactionAdded);
      clearInterval(refreshInterval);
    };
  }, [initialTransactions]);

  const validTransactions = Array.isArray(transactions) ? 
    transactions.filter(tx => tx && (typeof tx.gain === 'number' || typeof tx.amount === 'number') && tx.date) : [];
  
  const displayedTransactions = showAllTransactions 
    ? validTransactions 
    : validTransactions.slice(0, 3);
  
  const handleManualRefresh = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const refreshedTransactions = await fetchUserTransactions(session.user.id);
        if (refreshedTransactions) {
          setTransactions(refreshedTransactions);
          setRefreshKey(prev => prev + 1);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error manually refreshing transactions:", error);
      return false;
    }
  };
  
  return {
    showAllTransactions,
    setShowAllTransactions,
    validTransactions,
    displayedTransactions,
    refreshKey,
    handleManualRefresh,
    hiddenTransactionsCount: validTransactions.length > 3 ? validTransactions.length - 3 : 0
  };
};
