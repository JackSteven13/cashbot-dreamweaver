
import React from 'react';

interface TransactionFooterProps {
  showAllTransactions: boolean;
  hiddenTransactionsCount: number;
  setShowAllTransactions?: React.Dispatch<React.SetStateAction<boolean>>;
}

const TransactionFooter: React.FC<TransactionFooterProps> = ({
  showAllTransactions,
  hiddenTransactionsCount,
  setShowAllTransactions
}) => {
  if (showAllTransactions || hiddenTransactionsCount === 0) {
    return null;
  }

  return (
    <div className="text-center mt-4 text-sm text-muted-foreground">
      <p>
        {hiddenTransactionsCount} {hiddenTransactionsCount > 1 ? 'transactions masquées' : 'transaction masquée'}
      </p>
      {setShowAllTransactions && (
        <button 
          onClick={() => setShowAllTransactions(true)} 
          className="text-blue-500 hover:text-blue-700 text-sm mt-1"
        >
          Afficher tout
        </button>
      )}
    </div>
  );
};

export default TransactionFooter;
