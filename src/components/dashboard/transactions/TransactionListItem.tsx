
import React, { memo } from 'react';
import SessionCard from '@/components/SessionCard';
import { Transaction } from '@/types/userData';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';

interface TransactionListItemProps {
  transaction: Transaction;
  refreshKey: number;
  index: number;
  subscription?: string;
}

const TransactionListItem = memo(({ 
  transaction, 
  refreshKey, 
  index,
  subscription = 'freemium'
}: TransactionListItemProps) => {
  // Use session countdown hook to display countdown for freemium users
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    1, // We assume this transaction counts as a session
    subscription,
    transaction.date
  );
  
  // Vérifier si la transaction est du jour même
  const isToday = () => {
    try {
      if (!transaction.date) return false;
      
      // Format the dates as YYYY-MM-DD for proper comparison
      const txDate = new Date(transaction.date);
      const today = new Date();
      
      // Compare only year, month, day
      return (
        txDate.getFullYear() === today.getFullYear() &&
        txDate.getMonth() === today.getMonth() &&
        txDate.getDate() === today.getDate()
      );
    } catch (e) {
      console.error("Error checking if transaction is from today:", e, transaction.date);
      return false;
    }
  };
  
  const isTodayTx = isToday();
  
  return (
    <div className={`transaction-item ${isTodayTx ? 'today-transaction' : ''}`} data-index={index}>
      <SessionCard 
        key={`${transaction.id || ''}-${refreshKey}`}
        date={transaction.date}
        gain={transaction.gain || transaction.amount || 0}
        report={transaction.report || transaction.type || ''}
        isToday={isTodayTx}
      />
      
      {/* Show countdown if this is the most recent transaction for freemium users */}
      {index === 0 && isCountingDown && (
        <div className="mt-1 text-xs text-right text-slate-500">
          <span>Prochaine session disponible dans: {timeRemaining}</span>
        </div>
      )}
    </div>
  );
});

// Set display name for debugging
TransactionListItem.displayName = 'TransactionListItem';

export default TransactionListItem;
