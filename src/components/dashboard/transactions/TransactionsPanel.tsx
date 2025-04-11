
import React, { memo } from 'react';
import { Transaction } from '@/types/userData';
import { useTransactions } from './useTransactions';
import { 
  TransactionListItem, 
  TransactionEmptyState, 
  TransactionListActions, 
  TransactionFooter 
} from './index';

interface TransactionsPanelProps {
  transactions: Transaction[];
  subscription?: string;
  isNewUser?: boolean;
}

const TransactionsPanel = memo(({ 
  transactions = [],
  subscription = 'freemium',
  isNewUser = false
}: TransactionsPanelProps) => {
  const {
    showAllTransactions,
    setShowAllTransactions,
    validTransactions,
    displayedTransactions,
    refreshKey,
    handleManualRefresh,
    hiddenTransactionsCount
  } = useTransactions(transactions);

  return (
    <div className="space-y-4">
      {validTransactions.length > 0 ? (
        <>
          <TransactionListActions 
            showAllTransactions={showAllTransactions}
            setShowAllTransactions={setShowAllTransactions}
            validTransactionsCount={validTransactions.length}
            onManualRefresh={handleManualRefresh}
          />
          
          <div className="space-y-4 mt-4">
            {displayedTransactions.map((transaction, index) => (
              <TransactionListItem 
                key={`${transaction.id || index}-${refreshKey}`}
                transaction={transaction}
                refreshKey={refreshKey}
                index={index}
                subscription={subscription}
              />
            ))}
            
            <TransactionFooter 
              showAllTransactions={showAllTransactions}
              hiddenTransactionsCount={hiddenTransactionsCount}
            />
          </div>
        </>
      ) : (
        <TransactionEmptyState isNewUser={isNewUser} />
      )}
    </div>
  );
});

TransactionsPanel.displayName = 'TransactionsPanel';

export default TransactionsPanel;
