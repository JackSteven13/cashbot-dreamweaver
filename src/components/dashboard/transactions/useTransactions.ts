
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Transaction } from '@/types/userData';
import { fetchUserTransactions } from '@/utils/user/transactionUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useTransactions = (initialTransactions: Transaction[]) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef(0);
  const transactionsCacheKey = useRef('cachedTransactions');
  const initialFetchDone = useRef(false);
  
  // Initialize state from localStorage and props only once on component mount
  useEffect(() => {
    // Set cache key based on user ID for better isolation
    const setUserSpecificCacheKey = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user?.id) {
          transactionsCacheKey.current = `cachedTransactions_${data.session.user.id}`;
        }
      } catch (e) {
        console.error("Failed to get user for cache key:", e);
      }
    };
    
    setUserSpecificCacheKey();
    
    // Restore UI preferences from localStorage
    try {
      const storedShowAll = localStorage.getItem('showAllTransactions');
      if (storedShowAll) {
        setShowAllTransactions(storedShowAll === 'true');
      }
    } catch (e) {
      console.error("Error retrieving showAllTransactions preference:", e);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Handle initial transactions setup with proper dependency tracking
  useEffect(() => {
    if (!initialFetchDone.current) {
      // Set initial transactions from props
      if (Array.isArray(initialTransactions) && initialTransactions.length > 0) {
        setTransactions(initialTransactions);
        // Only cache valid transactions
        const validTx = initialTransactions.filter(tx => 
          tx && (typeof tx.gain === 'number' || typeof tx.amount === 'number') && tx.date);
        
        if (validTx.length > 0) {
          try {
            localStorage.setItem(transactionsCacheKey.current, JSON.stringify(validTx));
          } catch (e) {
            console.error("Failed to cache transactions:", e);
          }
        }
        initialFetchDone.current = true;
      } else {
        // Try to restore from cache if no initial transactions
        try {
          const cachedTransactions = localStorage.getItem(transactionsCacheKey.current);
          if (cachedTransactions) {
            const parsed = JSON.parse(cachedTransactions);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTransactions(parsed);
              initialFetchDone.current = true;
            }
          }
        } catch (e) {
          console.error("Failed to restore cached transactions:", e);
        }
      }
    }
  }, [initialTransactions]);
  
  // Separate update effect when initialTransactions change after initial load
  useEffect(() => {
    if (initialFetchDone.current && 
        Array.isArray(initialTransactions) && 
        initialTransactions.length > 0 && 
        isMountedRef.current) {
      
      // Only update if the new transactions are different
      if (JSON.stringify(initialTransactions) !== JSON.stringify(transactions)) {
        setTransactions(initialTransactions);
        
        try {
          localStorage.setItem(transactionsCacheKey.current, JSON.stringify(initialTransactions));
        } catch (e) {
          console.error("Failed to cache updated transactions:", e);
        }
      }
    }
  }, [initialTransactions, transactions]);
  
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
        if (now - lastFetchRef.current < 2000) {
          return; // Throttle to max once per 2 seconds
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
              localStorage.setItem(transactionsCacheKey.current, JSON.stringify(updatedTransactions));
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
      
      // Validate required data
      if (!userId || gain === undefined || !report) {
        return;
      }
      
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (session?.user?.id === userId) {
          // Optimistically update UI
          const newTransaction: Transaction = {
            id: `temp-${Date.now()}`,
            date: date || new Date().toISOString(),
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
                localStorage.setItem(transactionsCacheKey.current, JSON.stringify(updatedTransactions));
              } catch (e) {
                console.error("Failed to update cached transactions:", e);
              }
            }
          }, 800);
        }
      } catch (error) {
        console.error("Error handling transaction added:", error);
      }
    };
    
    // Define event types properly
    window.addEventListener('transactions:refresh', handleTransactionRefresh as EventListener);
    window.addEventListener('transaction:added', handleTransactionAdded as EventListener);
    
    return () => {
      window.removeEventListener('transactions:refresh', handleTransactionRefresh as EventListener);
      window.removeEventListener('transaction:added', handleTransactionAdded as EventListener);
    };
  }, []);
  
  // Manual refresh handler with improved error handling and feedback
  const handleManualRefresh = useCallback(async (): Promise<void> => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      
      if (!session?.user?.id || !isMountedRef.current) return;
      
      // Show visual feedback
      toast({
        title: "Actualisation en cours",
        description: "Chargement des transactions...",
        duration: 2000,
      });
      
      const refreshedTransactions = await fetchUserTransactions(session.user.id);
      if (refreshedTransactions && isMountedRef.current) {
        setTransactions(refreshedTransactions);
        setRefreshKey(prev => prev + 1);
        
        // Update localStorage cache
        try {
          localStorage.setItem(transactionsCacheKey.current, JSON.stringify(refreshedTransactions));
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
  
  // Memoize the transactions filtering to prevent unnecessary recalculations
  const { validTransactions, displayedTransactions, hiddenTransactionsCount } = useMemo(() => {
    // Filter valid transactions
    const validTx = Array.isArray(transactions) ? 
      transactions.filter(tx => tx && (typeof tx.gain === 'number' || typeof tx.amount === 'number') && tx.date) : [];
    
    // Determine which transactions to display
    const displayedTx = showAllTransactions 
      ? validTx 
      : validTx.slice(0, 3);
    
    // Calculate how many transactions are hidden
    const hiddenCount = validTx.length > 3 ? validTx.length - 3 : 0;
    
    return {
      validTransactions: validTx,
      displayedTransactions: displayedTx,
      hiddenTransactionsCount: hiddenCount
    };
  }, [transactions, showAllTransactions]);
  
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
