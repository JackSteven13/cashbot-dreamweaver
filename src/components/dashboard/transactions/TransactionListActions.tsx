
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
  // Ne rien afficher s'il n'y a pas assez de transactions
  if (validTransactionsCount <= 3) return null;
  
  return (
    <div className="flex justify-between items-center mb-4">
      <Button 
        variant="ghost"
        size="sm"
        onClick={() => setShowAllTransactions(!showAllTransactions)}
        className="text-xs font-normal text-slate-600 hover:text-slate-900"
      >
        {showAllTransactions ? 'Afficher les récentes' : 'Afficher tout'}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onManualRefresh}
        className="text-xs font-normal text-slate-600 hover:text-slate-900"
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        Actualiser
      </Button>
    </div>
  );
};

export default TransactionListActions;
