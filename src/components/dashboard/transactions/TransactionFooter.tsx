
import React from 'react';
import { Button } from '@/components/ui/button';

interface TransactionFooterProps {
  showAllTransactions: boolean;
  hiddenTransactionsCount: number;
  setShowAllTransactions: React.Dispatch<React.SetStateAction<boolean>>;
}

const TransactionFooter: React.FC<TransactionFooterProps> = ({
  showAllTransactions,
  hiddenTransactionsCount,
  setShowAllTransactions
}) => {
  if (hiddenTransactionsCount <= 0) {
    return null;
  }

  return (
    <div className="mt-4 text-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAllTransactions(!showAllTransactions)}
        className="text-xs w-full"
      >
        {showAllTransactions
          ? "Afficher moins"
          : `Afficher ${hiddenTransactionsCount} transaction${hiddenTransactionsCount > 1 ? 's' : ''} supplémentaire${hiddenTransactionsCount > 1 ? 's' : ''}`}
      </Button>
    </div>
  );
};

export default TransactionFooter;
