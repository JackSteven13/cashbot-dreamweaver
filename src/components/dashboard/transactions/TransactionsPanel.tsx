
import React from 'react';
import { Transaction } from '@/types/userData';
import TransactionsList from './TransactionsList';
import TransactionFooter from './TransactionFooter';
import { useTransactions } from './hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
  const {
    showAllTransactions,
    setShowAllTransactions,
    displayedTransactions,
    hiddenTransactionsCount,
    handleManualRefresh,
    refreshKey
  } = useTransactions(transactions);

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
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="h-8 px-2"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          <span className="text-xs">Actualiser</span>
        </Button>
      </div>
      
      <TransactionsList 
        transactions={displayedTransactions} 
        isLoading={isLoading}
        subscription={subscription}
        refreshKey={refreshKey}
      />
      
      <TransactionFooter 
        showAllTransactions={showAllTransactions}
        hiddenTransactionsCount={hiddenTransactionsCount}
        setShowAllTransactions={setShowAllTransactions}
      />
    </div>
  );
};

export default TransactionsPanel;
