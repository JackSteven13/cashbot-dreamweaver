
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/userData';
import { TransactionListItem, TransactionEmptyState, TransactionFooter } from './';

interface TransactionsListProps {
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription?: string;
  className?: string;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ 
  transactions = [], 
  isNewUser = false,
  subscription = 'freemium',
  className = ''
}) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [refreshKey] = useState(0);
  
  // Display only the 5 most recent transactions unless showAll is true
  const displayedTransactions = showAllTransactions 
    ? transactions 
    : transactions.slice(0, 5);
  
  const hiddenTransactionsCount = transactions.length - displayedTransactions.length;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Historique des transactions</CardTitle>
        <CardDescription>
          Vos gains récents et revenus générés par l'automatisation
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {displayedTransactions.map((transaction, index) => (
              <TransactionListItem 
                key={index} 
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
        ) : (
          <TransactionEmptyState isNewUser={isNewUser} />
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
