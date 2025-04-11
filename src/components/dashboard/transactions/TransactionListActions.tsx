
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';

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
  // Only show the toggle button if we have more than 3 transactions
  const shouldShowToggle = validTransactionsCount > 3;
  
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <h2 className="text-lg font-medium">Transactions récentes</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-2" 
          onClick={onManualRefresh}
          aria-label="Rafraîchir les transactions"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {shouldShowToggle && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowAllTransactions(!showAllTransactions)}
          className="text-sm flex items-center"
        >
          {showAllTransactions ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Réduire
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Voir tout
            </>
          )}
        </Button>
      )}
    </div>
  );
});

// Set display name for debugging
TransactionListActions.displayName = 'TransactionListActions';

export default TransactionListActions;
