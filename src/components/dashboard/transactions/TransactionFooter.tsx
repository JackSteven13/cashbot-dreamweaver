
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface TransactionFooterProps {
  showAllTransactions: boolean;
  hiddenTransactionsCount: number;
}

const TransactionFooter: React.FC<TransactionFooterProps> = ({
  showAllTransactions,
  hiddenTransactionsCount
}) => {
  if (showAllTransactions || hiddenTransactionsCount <= 0) return null;
  
  return (
    <div className="pt-2 text-center">
      <Button 
        variant="ghost" 
        size="sm"
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <ChevronDown className="h-4 w-4 mr-1" />
        {hiddenTransactionsCount} transaction{hiddenTransactionsCount > 1 ? 's' : ''} masquée{hiddenTransactionsCount > 1 ? 's' : ''}
      </Button>
    </div>
  );
};

export default TransactionFooter;
