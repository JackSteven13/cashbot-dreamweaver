
import React from 'react';

interface TransactionFooterProps {
  showAllTransactions: boolean;
  hiddenTransactionsCount: number;
}

const TransactionFooter: React.FC<TransactionFooterProps> = ({
  showAllTransactions,
  hiddenTransactionsCount
}) => {
  if (showAllTransactions || hiddenTransactionsCount === 0) {
    return null;
  }

  return (
    <div className="text-center mt-4 text-sm text-muted-foreground">
      <p>
        {hiddenTransactionsCount} {hiddenTransactionsCount > 1 ? 'transactions masquées' : 'transaction masquée'}
      </p>
    </div>
  );
};

export default TransactionFooter;
