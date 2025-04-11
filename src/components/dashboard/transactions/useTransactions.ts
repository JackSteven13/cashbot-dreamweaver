
import { useState, useEffect } from 'react';
import { Transaction } from '@/types/userData';
import { fetchUserTransactions } from '@/hooks/user/transactionUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useTransactions = (initialTransactions: Transaction[]) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Restore showAllTransactions state from localStorage
    try {
      const storedShowAll = localStorage.getItem('showAllTransactions');
      if (storedShowAll) {
        setShowAllTransactions(storedShowAll === 'true');
      }
    } catch (e) {
      console.error("Error retrieving showAllTransactions from localStorage:", e);
    }

    setTransactions(initialTransactions);
    
    // Store initialTransactions in localStorage for persistence
    if (initialTransactions && initialTransactions.length > 0) {
      try {
        localStorage.setItem('cachedTransactions', JSON.stringify(initialTransactions));
      } catch (e) {
        console.error("Failed to cache transactions in localStorage:", e);
      }
    } else {
      // Try to restore transactions from localStorage if initialTransactions is empty
      try {
        const cachedTransactions = localStorage.getItem('cachedTransactions');
        if (cachedTransactions) {
          const parsed = JSON.parse(cachedTransactions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTransactions(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to restore cached transactions:", e);
      }
    }
    
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
            
            // Update localStorage cache
            try {
              localStorage.setItem('cachedTransactions', JSON.stringify(updatedTransactions));
            } catch (e) {
              console.error("Failed to update cached transactions:", e);
            }
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
          
          setTransactions(prev => {
            const updated = [newTransaction, ...prev];
            // Update localStorage cache
            try {
              localStorage.setItem('cachedTransactions', JSON.stringify(updated));
            } catch (e) {
              console.error("Failed to update cached transactions:", e);
            }
            return updated;
          });
          
          setTimeout(async () => {
            const updatedTransactions = await fetchUserTransactions(userId);
            if (updatedTransactions && updatedTransactions.length > 0) {
              setTransactions(updatedTransactions);
              setRefreshKey(prev => prev + 1);
              
              // Update localStorage cache
              try {
                localStorage.setItem('cachedTransactions', JSON.stringify(updatedTransactions));
              } catch (e) {
                console.error("Failed to update cached transactions:", e);
              }
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
            
            // Update localStorage cache
            try {
              localStorage.setItem('cachedTransactions', JSON.stringify(refreshedTransactions));
            } catch (e) {
              console.error("Failed to update cached transactions:", e);
            }
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
  
  // Update localStorage when showAllTransactions changes
  useEffect(() => {
    try {
      localStorage.setItem('showAllTransactions', showAllTransactions.toString());
    } catch (e) {
      console.error("Error storing showAllTransactions in localStorage:", e);
    }
  }, [showAllTransactions]);

  const validTransactions = Array.isArray(transactions) ? 
    transactions.filter(tx => tx && (typeof tx.gain === 'number' || typeof tx.amount === 'number') && tx.date) : [];
  
  const displayedTransactions = showAllTransactions 
    ? validTransactions 
    : validTransactions.slice(0, 3);
  
  const handleManualRefresh = async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const refreshedTransactions = await fetchUserTransactions(session.user.id);
        if (refreshedTransactions) {
          setTransactions(refreshedTransactions);
          setRefreshKey(prev => prev + 1);
          
          // Update localStorage cache
          try {
            localStorage.setItem('cachedTransactions', JSON.stringify(refreshedTransactions));
          } catch (e) {
            console.error("Failed to update cached transactions:", e);
          }
          
          toast({
            title: "Liste mise à jour",
            description: "Les transactions ont été actualisées.",
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error manually refreshing transactions:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir les transactions.",
        variant: "destructive",
        duration: 3000,
      });
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
