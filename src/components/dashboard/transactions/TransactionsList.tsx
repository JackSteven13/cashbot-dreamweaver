
import React, { memo, useState, useEffect } from 'react';
import { Transaction } from '@/types/userData';
import TransactionListItem from './TransactionListItem';
import TransactionEmptyState from './TransactionEmptyState';
import TransactionListActions from './TransactionListActions';

interface TransactionsListProps {
  transactions: Transaction[];
  subscription?: string;
  refreshKey?: number;
  isNewUser?: boolean;
}

// Use memo to prevent unnecessary re-renders
const TransactionsList: React.FC<TransactionsListProps> = memo(({
  transactions,
  subscription = 'freemium',
  refreshKey = 0,
  isNewUser = false
}) => {
  // Only update lastRendered when refreshKey changes
  const [lastRendered, setLastRendered] = useState<Date>(() => new Date());
  
  useEffect(() => {
    if (refreshKey > 0) {
      setLastRendered(new Date());
    }
  }, [refreshKey]);

  if (!transactions || transactions.length === 0) {
    return <TransactionEmptyState isNewUser={isNewUser} />;
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
