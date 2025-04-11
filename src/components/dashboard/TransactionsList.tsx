
import React, { memo } from 'react';
import { useTransactions } from './transactions/useTransactions';
import { Transaction } from '@/types/userData';
import { 
  TransactionListItem, 
  TransactionEmptyState,
  TransactionListActions,
  TransactionFooter 
} from './transactions';

interface TransactionsListProps {
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription?: string;
}

// Utiliser memo pour éviter les rendus inutiles
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
  
  return (
    <div className="mb-8" key={refreshKey}>
      <TransactionListActions
        showAllTransactions={showAllTransactions}
        setShowAllTransactions={setShowAllTransactions}
        validTransactionsCount={validTransactions.length}
        onManualRefresh={handleManualRefresh}
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
    </div>
  );
});

// Set display name for debugging
TransactionsList.displayName = 'TransactionsList';

export default TransactionsList;
