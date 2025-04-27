
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface TransactionListActionsProps {
  showAllTransactions: boolean;
  setShowAllTransactions: React.Dispatch<React.SetStateAction<boolean>>;
  validTransactionsCount: number;
  onManualRefresh?: () => Promise<void>;
}

const TransactionListActions: React.FC<TransactionListActionsProps> = ({
  showAllTransactions,
  setShowAllTransactions,
  validTransactionsCount,
  onManualRefresh
}) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <div>
        {validTransactionsCount > 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllTransactions(!showAllTransactions)}
            className="text-xs h-7"
          >
            {showAllTransactions ? "Afficher moins" : "Afficher tout"}
          </Button>
        )}
      </div>
      
      {onManualRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onManualRefresh}
          className="text-xs h-7"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Actualiser
        </Button>
      )}
    </div>
  );
};

export default TransactionListActions;
