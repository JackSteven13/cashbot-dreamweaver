
import React, { memo } from 'react';
import { Transaction } from '@/types/userData';
import { formatDate } from '@/utils/dateFormatter';

interface TransactionListItemProps {
  transaction: Transaction;
  refreshKey?: number;
  index?: number;
  subscription?: string;
}

const TransactionListItem: React.FC<TransactionListItemProps> = memo(({ 
  transaction, 
  refreshKey, 
  index = 0,
  subscription = 'freemium'
}) => {
  const { date, gain = 0, report = '', amount = 0, type = 'system' } = transaction;
  
  // Use gain if available, otherwise fall back to amount
  const displayAmount = gain !== undefined ? gain : amount;
  
  // Format the date (assuming a utility function exists)
  const formattedDate = formatDate ? formatDate(date) : new Date(date).toLocaleString();
  
  // Determine if this is a positive transaction
  const isPositive = displayAmount > 0;
  
  return (
    <div 
      className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'both',
        animationName: 'fadeInUp',
        animationDuration: '400ms'
      }}
    >
      <div className="flex flex-col">
        <span className="font-medium text-sm">
          {report || (type === 'system' ? 'Gain automatique' : type)}
        </span>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>
      <div className={`font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isPositive ? '+' : ''}{displayAmount.toFixed(2)}€
      </div>
    </div>
  );
});

TransactionListItem.displayName = 'TransactionListItem';

export default TransactionListItem;
