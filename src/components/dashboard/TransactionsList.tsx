
import React from 'react';
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

const TransactionsList = ({ 
  transactions: initialTransactions, 
  isNewUser = false
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
              key={`${transaction.id || ''}-${index}`}
              transaction={transaction}
              refreshKey={refreshKey}
              index={index}
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
};

export default TransactionsList;
