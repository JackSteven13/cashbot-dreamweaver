
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface TransactionListActionsProps {
  showAllTransactions: boolean;
  setShowAllTransactions: (show: boolean) => void;
  validTransactionsCount: number;
  onManualRefresh: () => Promise<void>;
}

const TransactionListActions: React.FC<TransactionListActionsProps> = ({
  showAllTransactions,
  setShowAllTransactions,
  validTransactionsCount,
  onManualRefresh
}) => {
  if (validTransactionsCount === 0) return null;

  return (
    <div className="flex justify-between items-center mb-4">
      <Button
        variant="ghost"
        size="sm"
        className="text-sm font-normal flex items-center gap-1"
        onClick={() => setShowAllTransactions(!showAllTransactions)}
      >
        {showAllTransactions ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Voir moins
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Voir tout
          </>
        )}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onManualRefresh}
        className="text-sm font-normal"
      >
        <RefreshCw className="w-4 h-4 mr-1" />
        Actualiser
      </Button>
    </div>
  );
};

export default TransactionListActions;
