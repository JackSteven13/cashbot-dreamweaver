
import React, { memo, useCallback, useState, useEffect } from 'react';
import { Transaction } from '@/types/userData';
import TransactionListItem from './TransactionListItem';

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  subscription?: string;
  refreshKey?: number;
}

// Use memo to prevent unnecessary re-renders
const TransactionsList: React.FC<TransactionsListProps> = memo(({
  transactions,
  isLoading = false,
  subscription = 'freemium',
  refreshKey = 0
}) => {
  // Only update lastRendered when refreshKey changes
  const [lastRendered, setLastRendered] = useState(new Date());
  
  useEffect(() => {
    if (refreshKey > 0) {
      setLastRendered(new Date());
    }
  }, [refreshKey]);
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Chargement des transactions...</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Aucune transaction à afficher.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction, index) => (
        <TransactionListItem 
          key={`${transaction.id || ''}-${index}-${refreshKey}`}
          transaction={transaction}
          subscription={subscription}
          refreshKey={refreshKey}
          index={index}
        />
      ))}
      <div className="text-xs text-muted-foreground mt-2 text-right">
        Dernière mise à jour: {lastRendered.toLocaleTimeString()}
      </div>
    </div>
  );
});

// Set display name for debugging
TransactionsList.displayName = 'TransactionsList';

export default TransactionsList;
