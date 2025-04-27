
import React, { memo, useEffect, useState, useCallback } from 'react';
import { useTransactions } from './transactions/hooks/useTransactions';
import { Transaction } from '@/types/userData';
import { TransactionListItem, TransactionEmptyState, TransactionListActions, TransactionFooter } from './transactions';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';

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
    hiddenTransactionsCount
  } = useTransactions(initialTransactions);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { user } = useAuth();
  
  // Force refresh on mount to get latest transactions
  useEffect(() => {
    if (user?.id) {
      onManualRefresh();
    }
  }, [user?.id]);
  
  // Setup real-time update listeners with more frequent checks
  useEffect(() => {
    const handleRealtimeUpdate = () => {
      setIsRefreshing(true);
      // Short delay to simulate fetching
      setTimeout(() => {
        handleManualRefresh()
          .then(() => {
            setIsRefreshing(false);
            setLastUpdated(new Date());
            toast({
              title: "Transactions mises à jour",
              description: "Nouvelles transactions synchronisées en temps réel",
              duration: 2000,
            });
          })
          .catch(() => {
            setIsRefreshing(false);
          });
      }, 300);
    };
    
    // Écouter plus d'événements pour s'assurer que les transactions sont à jour
    window.addEventListener('transactions:refresh', handleRealtimeUpdate as EventListener);
    window.addEventListener('balance:update', handleRealtimeUpdate as EventListener);
    window.addEventListener('automatic:revenue', handleRealtimeUpdate as EventListener);
    window.addEventListener('balance:daily-growth', handleRealtimeUpdate as EventListener);
    
    // Rafraîchir automatiquement toutes les 60 secondes
    const autoRefresh = setInterval(() => {
      if (user?.id) {
        // Use a direct fetch rather than state update to avoid UI flicker
        fetchUserTransactions(user.id, true)
          .then(() => {
            setLastUpdated(new Date());
            console.log("Transactions auto-refreshed silently");
          })
          .catch(() => {
            console.error("Failed to auto-refresh transactions");
          });
      }
    }, 60000); // 60 seconds
    
    return () => {
      window.removeEventListener('transactions:refresh', handleRealtimeUpdate as EventListener);
      window.removeEventListener('balance:update', handleRealtimeUpdate as EventListener);
      window.removeEventListener('automatic:revenue', handleRealtimeUpdate as EventListener);
      window.removeEventListener('balance:daily-growth', handleRealtimeUpdate as EventListener);
      clearInterval(autoRefresh);
    };
  }, [handleManualRefresh, user?.id]);
  
  // Handle manual refresh
  const onManualRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await handleManualRefresh();
      setLastUpdated(new Date());
      toast({
        title: "Transactions actualisées",
        description: "Les dernières transactions ont été chargées",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error refreshing transactions:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir les transactions",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [handleManualRefresh, isRefreshing]);
  
  return (
    <div className="mb-8" key={refreshKey}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Historique des transactions</h3>
        {isRefreshing && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Synchronisation...
          </div>
        )}
      </div>
      
      <TransactionListActions
        showAllTransactions={showAllTransactions}
        setShowAllTransactions={setShowAllTransactions}
        validTransactionsCount={validTransactions.length}
        onManualRefresh={onManualRefresh}
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
        setShowAllTransactions={setShowAllTransactions}
      />
      
      <div className="text-xs text-muted-foreground mt-2 text-right">
        Dernière mise à jour: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
});

// Set display name for debugging
TransactionsList.displayName = 'TransactionsList';

export default TransactionsList;
