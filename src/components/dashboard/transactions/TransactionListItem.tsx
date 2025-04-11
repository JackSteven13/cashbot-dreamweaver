
import React from 'react';
import SessionCard from '@/components/SessionCard';
import { Transaction } from '@/types/userData';

interface TransactionListItemProps {
  transaction: Transaction;
  refreshKey: number;
  index: number;
}

const TransactionListItem = ({ transaction, refreshKey, index }: TransactionListItemProps) => {
  return (
    <SessionCard 
      key={`${transaction.id || ''}-${index}-${refreshKey}`}
      date={transaction.date}
      gain={transaction.gain || transaction.amount || 0}
      report={transaction.report || transaction.type || ''}
    />
  );
};

export default TransactionListItem;
