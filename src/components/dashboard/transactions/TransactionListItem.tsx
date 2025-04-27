
import React from 'react';
import { Transaction } from '@/types/userData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface TransactionListItemProps {
  transaction: Transaction;
  subscription?: string;
  refreshKey?: number;
  index: number;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({
  transaction,
  subscription = 'freemium',
  refreshKey = 0,
  index
}) => {
  // Format the date
  const formattedDate = transaction.date 
    ? formatDistanceToNow(new Date(transaction.date), { addSuffix: true, locale: fr })
    : 'Date inconnue';

  // Determine transaction amount
  const amount = transaction.gain || transaction.amount || 0;
  const isPositive = amount > 0;
  
  // Format the transaction type
  const getTransactionType = () => {
    if (transaction.type) return transaction.type;
    if (transaction.report) {
      if (transaction.report.toLowerCase().includes('parrainage')) return 'Parrainage';
      if (transaction.report.toLowerCase().includes('retrait')) return 'Retrait';
      if (transaction.report.toLowerCase().includes('session')) return 'Session';
      if (transaction.report.toLowerCase().includes('automatique')) return 'Automatique';
    }
    return isPositive ? 'Gain' : 'Retrait';
  };
  
  const transactionType = getTransactionType();
  
  // Animation delay based on index
  const animationDelay = `${Math.min(index * 50, 500)}ms`;
  
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center",
        "transition-all duration-300 ease-in-out transform hover:shadow-md",
        "animate-fade-in-up opacity-0"
      )}
      style={{ 
        animationDelay,
        animationFillMode: 'forwards'
      }}
    >
      <div className="flex flex-col">
        <span className="font-medium text-sm">
          {transaction.report || transactionType}
        </span>
        <span className="text-xs text-muted-foreground">
          {formattedDate}
        </span>
      </div>
      
      <div className={cn(
        "font-semibold",
        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      )}>
        {isPositive ? '+' : '-'}{Math.abs(amount).toFixed(2)}€
      </div>
    </div>
  );
};

export default TransactionListItem;
