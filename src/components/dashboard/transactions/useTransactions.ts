
import { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction } from '@/types/userData';
import { fetchUserTransactions } from '@/utils/user/transactionUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useTransactions = (initialTransactions: Transaction[]) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  const [refreshKey, setRefreshKey] = useState(0);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef(0);
  const transactionsCacheKey = 'cachedTransactions';
  
  // Initialize state from localStorage and props
  useEffect(() => {
    // Restore UI preferences from localStorage
    try {
      const storedShowAll = localStorage.getItem('showAllTransactions');
      if (storedShowAll) {
        setShowAllTransactions(storedShowAll === 'true');
      }
    } catch (e) {
      console.error("Error retrieving showAllTransactions preference:", e);
    }
    
    // Set initial transactions from props or localStorage cache
    if (initialTransactions && initialTransactions.length > 0) {
      setTransactions(initialTransactions);
      try {
        localStorage.setItem(transactionsCacheKey, JSON.stringify(initialTransactions));
      } catch (e) {
        console.error("Failed to cache transactions:", e);
      }
    } else {
      // Try to restore from cache if no initial transactions
      try {
        const cachedTransactions = localStorage.getItem(transactionsCacheKey);
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
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Separate effect for handling transaction updates with better dependency handling
  useEffect(() => {
    if (initialTransactions && initialTransactions.length > 0 && isMountedRef.current) {
      setTransactions(initialTransactions);
      try {
        localStorage.setItem(transactionsCacheKey, JSON.stringify(initialTransactions));
      } catch (e) {
        console.error("Failed to cache transactions:", e);
      }
    }
  }, [initialTransactions]);
  
  // Store UI preferences when they change
  useEffect(() => {
    try {
      localStorage.setItem('showAllTransactions', showAllTransactions.toString());
    } catch (e) {
      console.error("Error storing showAllTransactions preference:", e);
    }
  }, [showAllTransactions]);
  
  // Handle real-time transaction updates with better cleanup
  useEffect(() => {
    const handleTransactionRefresh = async (event: CustomEvent) => {
      const userId = event.detail?.userId;
      
      if (!userId || !isMountedRef.current) return;
      
      try {
        // Prevent excessive refreshes
        const now = Date.now();
        if (now - lastFetchRef.current < 1000) {
          return; // Throttle to max once per second
        }
        lastFetchRef.current = now;
        
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (session?.user?.id === userId) {
          const updatedTransactions = await fetchUserTransactions(userId);
          if (updatedTransactions && updatedTransactions.length > 0 && isMountedRef.current) {
            setTransactions(updatedTransactions);
            setRefreshKey(prev => prev + 1);
            
            // Update localStorage cache
            try {
              localStorage.setItem(transactionsCacheKey, JSON.stringify(updatedTransactions));
            } catch (e) {
              console.error("Failed to update cached transactions:", e);
            }
          }
        }
      } catch (error) {
        console.error("Error refreshing transactions:", error);
      }
    };
    
    // Function to handle new transactions being added
    const handleTransactionAdded = async (event: CustomEvent) => {
      if (!isMountedRef.current) return;
      
      const { userId, gain, report, date } = event.detail || {};
      
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (session?.user?.id === userId) {
          // Optimistically update UI
          const newTransaction: Transaction = {
            id: `temp-${Date.now()}`,
            date,
            amount: gain,
            type: report,
            report,
            gain
          };
          
          setTransactions(prev => [newTransaction, ...prev]);
          
          // Refresh from server after slight delay
          setTimeout(async () => {
            if (!isMountedRef.current) return;
            
            const updatedTransactions = await fetchUserTransactions(userId);
            if (updatedTransactions && updatedTransactions.length > 0) {
              setTransactions(updatedTransactions);
              setRefreshKey(prev => prev + 1);
              
              // Update localStorage cache
              try {
                localStorage.setItem(transactionsCacheKey, JSON.stringify(updatedTransactions));
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
    
    window.addEventListener('transactions:refresh' as any, handleTransactionRefresh);
    window.addEventListener('transaction:added' as any, handleTransactionAdded);
    
    return () => {
      window.removeEventListener('transactions:refresh' as any, handleTransactionRefresh);
      window.removeEventListener('transaction:added' as any, handleTransactionAdded);
    };
  }, []);
  
  // Manual refresh handler with improved error handling and feedback
  const handleManualRefresh = useCallback(async (): Promise<void> => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      
      if (!session?.user?.id || !isMountedRef.current) return;
      
      const refreshedTransactions = await fetchUserTransactions(session.user.id);
      if (refreshedTransactions && isMountedRef.current) {
        setTransactions(refreshedTransactions);
        setRefreshKey(prev => prev + 1);
        
        // Update localStorage cache
        try {
          localStorage.setItem(transactionsCacheKey, JSON.stringify(refreshedTransactions));
        } catch (e) {
          console.error("Failed to update cached transactions:", e);
        }
        
        toast({
          title: "Liste mise à jour",
          description: "Les transactions ont été actualisées.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error manually refreshing transactions:", error);
      if (isMountedRef.current) {
        toast({
          title: "Erreur",
          description: "Impossible de rafraîchir les transactions.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  }, []);
  
  // Filter valid transactions and prepare display data
  const validTransactions = Array.isArray(transactions) ? 
    transactions.filter(tx => tx && (typeof tx.gain === 'number' || typeof tx.amount === 'number') && tx.date) : [];
  
  const displayedTransactions = showAllTransactions 
    ? validTransactions 
    : validTransactions.slice(0, 3);
  
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
