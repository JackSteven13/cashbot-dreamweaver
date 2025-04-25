
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionListItem, TransactionEmptyState, TransactionListActions } from './transactions';
import { Transaction } from '@/types/userData';

interface TransactionsListProps {
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription?: string;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ 
  transactions = [], 
  isNewUser = false,
  subscription = 'freemium'
}) => {
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      setDisplayedTransactions(transactions.slice(0, 10)); // Show only 10 transactions
    } else {
      setDisplayedTransactions([]);
    }
  }, [transactions, refreshKey]);

  const refreshTransactions = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Historique des transactions</span>
          <TransactionListActions onRefresh={refreshTransactions} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedTransactions.length > 0 ? (
            displayedTransactions.map((transaction, index) => (
              <TransactionListItem 
                key={transaction.id || index} 
                transaction={transaction} 
                refreshKey={refreshKey}
                index={index}
                subscription={subscription}
              />
            ))
          ) : (
            <TransactionEmptyState isNewUser={isNewUser} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
