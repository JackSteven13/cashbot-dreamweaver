
import React, { memo, useEffect, useState, useCallback } from 'react';
import { useTransactions } from './transactions/hooks/useTransactions';
import { Transaction } from '@/types/userData';
import { TransactionListItem, TransactionEmptyState, TransactionListActions, TransactionFooter } from './transactions';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TransactionsListProps {
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription?: string;
}

const TransactionsList = memo(({ 
  transactions: initialTransactions, 
  isNewUser = false,
  subscription = 'freemium'
}: TransactionsListProps) => {
  const {
    showAllTransactions,
    setShowAllTransactions,
    validTransactions,
    displayedTransactions,
    refreshKey,
    handleManualRefresh,
    hiddenTransactionsCount,
    setTransactions,
    fetchTransactionsFromDB
  } = useTransactions(initialTransactions);
  
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Enhanced transaction fetching with better error handling and immediate execution on mount
  const fetchLatestTransactions = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsRefreshing(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }
      
      if (data && Array.isArray(data)) {
        const formattedTransactions = data.map((tx: any) => ({
          id: tx.id,
          date: tx.created_at || tx.date,
          amount: tx.gain,
          gain: tx.gain,
          report: tx.report,
          type: tx.type || 'system'
        }));
        
        setTransactions(formattedTransactions);
        
        // Ensure UI is updated with new transaction data
        window.dispatchEvent(new CustomEvent('transactions:updated', {
          detail: { transactions: formattedTransactions, userId: user.id, timestamp: Date.now() }
        }));
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  }, [user, setTransactions]);
  
  // Improved real-time subscription with immediate initial fetch
  useEffect(() => {
    if (!user?.id) return;
    
    // Fetch immediately on mount
    fetchLatestTransactions();
    
    const handleRealtimeUpdate = (event: CustomEvent) => {
      const eventUserId = event.detail?.userId;
      if (eventUserId && eventUserId !== user.id) {
        return;
      }
      
      console.log("Transaction update event received - fetching latest transactions");
      fetchLatestTransactions();
    };
    
    // Set up event listeners
    window.addEventListener('transactions:refresh', handleRealtimeUpdate as EventListener);
    window.addEventListener('balance:update', handleRealtimeUpdate as EventListener);
    window.addEventListener('automatic:revenue', handleRealtimeUpdate as EventListener);
    window.addEventListener('balance:daily-growth', handleRealtimeUpdate as EventListener);
    window.addEventListener('session:completed', handleRealtimeUpdate as EventListener);
    window.addEventListener('transactions:updated', handleRealtimeUpdate as EventListener);
    window.addEventListener('user:refreshed', handleRealtimeUpdate as EventListener);
    
    // Set up real-time subscription
    const setupRealtimeSubscription = async () => {
      if (!user?.id) return;
      
      console.log('Setting up realtime subscription for transactions');
      
      const channel = supabase
        .channel('transactions_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          console.log('Realtime update detected for transactions:', payload);
          fetchLatestTransactions();
        })
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });
      
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const realtimeCleanup = setupRealtimeSubscription();
    
    // Set up polling as a fallback mechanism
    const pollingInterval = setInterval(() => {
      fetchLatestTransactions();
    }, 15000); // Poll every 15 seconds
    
    return () => {
      // Clean up all listeners and subscriptions
      window.removeEventListener('transactions:refresh', handleRealtimeUpdate as EventListener);
      window.removeEventListener('balance:update', handleRealtimeUpdate as EventListener);
      window.removeEventListener('automatic:revenue', handleRealtimeUpdate as EventListener);
      window.removeEventListener('balance:daily-growth', handleRealtimeUpdate as EventListener);
      window.removeEventListener('session:completed', handleRealtimeUpdate as EventListener);
      window.removeEventListener('transactions:updated', handleRealtimeUpdate as EventListener);
      window.removeEventListener('user:refreshed', handleRealtimeUpdate as EventListener);
      clearInterval(pollingInterval);
      
      realtimeCleanup.then(cleanup => {
        if (cleanup) cleanup();
      });
    };
  }, [fetchLatestTransactions, user]);
  
  // Enhanced render with better loading states and refreshing indicator
  return (
    <div className="mb-8 min-h-[400px]" key={refreshKey}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Historique des transactions</h3>
        {isRefreshing && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Mise à jour...
          </div>
        )}
      </div>
      
      <TransactionListActions
        showAllTransactions={showAllTransactions}
        setShowAllTransactions={setShowAllTransactions}
        validTransactionsCount={validTransactions.length}
        onManualRefresh={async () => {
          setIsRefreshing(true);
          try {
            await fetchTransactionsFromDB();
            toast({
              title: "Historique mis à jour",
              description: "Les transactions ont été synchronisées avec succès",
              duration: 2000,
            });
          } catch (error) {
            console.error("Error refreshing transactions:", error);
            toast({
              title: "Erreur",
              description: "Impossible de synchroniser les transactions",
              variant: "destructive",
              duration: 2000,
            });
          } finally {
            setIsRefreshing(false);
          }
        }}
      />
      
      {displayedTransactions.length > 0 ? (
        <div className="space-y-4">
          {displayedTransactions.map((transaction, index) => (
            <TransactionListItem
              key={`${transaction.id || ''}-${index}-${refreshKey}`}
              transaction={transaction}
              refreshKey={refreshKey}
              index={index}
              subscription={subscription}
            />
          ))}
        </div>
      ) : (
        <TransactionEmptyState isNewUser={isNewUser} />
      )}
      
      <TransactionFooter 
        showAllTransactions={showAllTransactions} 
        hiddenTransactionsCount={hiddenTransactionsCount} 
      />
      
      <div className="text-xs text-muted-foreground mt-2 text-right">
        Mise à jour: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
});

TransactionsList.displayName = 'TransactionsList';

export default TransactionsList;
