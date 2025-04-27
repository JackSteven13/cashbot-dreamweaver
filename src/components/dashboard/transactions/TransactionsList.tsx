
import React from 'react';
import { Transaction } from '@/types/userData';
import TransactionListItem from './TransactionListItem';

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  subscription?: string;
  refreshKey?: number;
}

const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  isLoading = false,
  subscription = 'freemium',
  refreshKey = 0
}) => {
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
          key={transaction.id || index}
          transaction={transaction}
          subscription={subscription}
          refreshKey={refreshKey}
          index={index}
        />
      ))}
    </div>
  );
};

export default TransactionsList;
