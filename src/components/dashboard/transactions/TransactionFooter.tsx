
import React from 'react';

interface TransactionFooterProps {
  showAllTransactions: boolean;
  hiddenTransactionsCount: number;
}

const TransactionFooter = ({ 
  showAllTransactions, 
  hiddenTransactionsCount 
}: TransactionFooterProps) => {
  if (showAllTransactions || hiddenTransactionsCount <= 0) return null;
  
  return (
    <div className="text-center mt-4">
      <p className="text-sm text-[#486581]">
        {hiddenTransactionsCount} {hiddenTransactionsCount > 1 ? 'autres sessions' : 'autre session'} non affichée{hiddenTransactionsCount > 1 ? 's' : ''}.
      </p>
    </div>
  );
};

export default TransactionFooter;
