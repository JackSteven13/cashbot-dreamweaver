
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface TransactionListActionsProps {
  showAllTransactions: boolean;
  setShowAllTransactions: (show: boolean) => void;
  validTransactionsCount: number;
  onManualRefresh: () => Promise<void>;
}

const TransactionListActions = memo(({ 
  showAllTransactions, 
  setShowAllTransactions, 
  validTransactionsCount,
  onManualRefresh 
}: TransactionListActionsProps) => {
  if (validTransactionsCount === 0) return null;
  
  return (
    <div className="flex justify-between items-center mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAllTransactions(!showAllTransactions)}
      >
        {showAllTransactions ? 'Afficher moins' : 'Afficher tout'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onManualRefresh}
        className="ml-auto"
      >
        <RefreshCcw className="h-4 w-4 mr-1" />
        Actualiser
      </Button>
    </div>
  );
});

// Set display name for debugging
TransactionListActions.displayName = 'TransactionListActions';

export default TransactionListActions;
