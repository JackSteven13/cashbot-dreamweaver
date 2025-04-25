
import React, { memo, useEffect, useState } from 'react';
import { useTransactions } from './transactions/hooks/useTransactions';
import { Transaction } from '@/types/userData';
import { TransactionListItem, TransactionEmptyState, TransactionListActions, TransactionFooter } from './transactions';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

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
      }, 500);
    };
    
    // Écouter plus d'événements pour s'assurer que les transactions sont à jour
    window.addEventListener('transactions:refresh', handleRealtimeUpdate);
    window.addEventListener('balance:update', handleRealtimeUpdate);
    window.addEventListener('automatic:revenue', handleRealtimeUpdate);
    window.addEventListener('balance:daily-growth', handleRealtimeUpdate);
    
    // Rafraîchir automatiquement toutes les 2 minutes
    const autoRefresh = setInterval(() => {
      handleManualRefresh()
        .then(() => {
          setLastUpdated(new Date());
          console.log("Transactions auto-refreshed");
        })
        .catch(() => {
          console.error("Failed to auto-refresh transactions");
        });
    }, 120000); // 2 minutes
    
    return () => {
      window.removeEventListener('transactions:refresh', handleRealtimeUpdate);
      window.removeEventListener('balance:update', handleRealtimeUpdate);
      window.removeEventListener('automatic:revenue', handleRealtimeUpdate);
      window.removeEventListener('balance:daily-growth', handleRealtimeUpdate);
      clearInterval(autoRefresh);
    };
  }, [handleManualRefresh]);
  
  // Refresh transactions on first load
  useEffect(() => {
    // Premier rafraîchissement après 5 secondes pour laisser le temps aux données de se charger
    const initialRefreshTimeout = setTimeout(() => {
      handleManualRefresh()
        .then(() => {
          setLastUpdated(new Date());
          console.log("Initial transaction refresh complete");
        })
        .catch((error) => {
          console.error("Failed to refresh transactions:", error);
        });
    }, 5000);
    
    return () => {
      clearTimeout(initialRefreshTimeout);
    };
  }, [handleManualRefresh]);
  
  // Handle manual refresh
  const onManualRefresh = async () => {
    setIsRefreshing(true);
    await handleManualRefresh();
    setIsRefreshing(false);
    setLastUpdated(new Date());
  };
  
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
