
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

interface TransactionFooterProps {
  showAllTransactions: boolean;
  hiddenTransactionsCount: number;
}

const TransactionFooter = memo(({ 
  showAllTransactions, 
  hiddenTransactionsCount 
}: TransactionFooterProps) => {
  if (!showAllTransactions || hiddenTransactionsCount <= 0) {
    return null;
  }
  
  return (
    <div className="mt-4 text-center">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="text-sm flex items-center justify-center"
      >
        <ChevronUp className="h-4 w-4 mr-1" />
        Retour en haut
      </Button>
    </div>
  );
});

// Set display name for debugging
TransactionFooter.displayName = 'TransactionFooter';

export default TransactionFooter;
