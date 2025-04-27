
import React, { useState, useCallback } from 'react';
import { Transaction } from '@/types/userData';
import TransactionsList from './TransactionsList';
import TransactionFooter from './TransactionFooter';
import { useTransactions } from './hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

interface TransactionsPanelProps {
  transactions: Transaction[];
  isLoading?: boolean;
  isNewUser?: boolean;
  subscription?: string;
}

const TransactionsPanel: React.FC<TransactionsPanelProps> = ({
  transactions,
  isLoading = false,
  isNewUser = false,
  subscription = 'freemium'
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    showAllTransactions,
    setShowAllTransactions,
    displayedTransactions,
    hiddenTransactionsCount,
    handleManualRefresh,
    refreshKey
  } = useTransactions(transactions);

  // Memoize the refresh handler
  const onRefreshClick = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await handleManualRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [handleManualRefresh, isRefreshing]);

  if (isNewUser) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Aucune transaction à afficher. Commencez à générer des gains pour les voir apparaître ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Transactions récentes</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshClick}
          disabled={isLoading || isRefreshing}
          className="h-8 px-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          <span className="text-xs">Actualiser</span>
        </Button>
      </div>
      
      <div>
        {isLoading || isRefreshing ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Chargement des transactions...</p>
          </div>
        ) : (
          displayedTransactions.length > 0 ? (
            <TransactionsList 
              transactions={displayedTransactions}
              subscription={subscription}
              refreshKey={refreshKey}
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Aucune transaction à afficher.</p>
            </div>
          )
        )}
      </div>
      
      <TransactionFooter 
        showAllTransactions={showAllTransactions}
        hiddenTransactionsCount={hiddenTransactionsCount}
        setShowAllTransactions={setShowAllTransactions}
      />
    </div>
  );
};

export default TransactionsPanel;
