
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

interface TransactionFooterProps {
  showAllTransactions: boolean;
  hiddenTransactionsCount: number;
  onShowAll?: () => void;
}

const TransactionFooter: React.FC<TransactionFooterProps> = ({
  showAllTransactions,
  hiddenTransactionsCount,
  onShowAll
}) => {
  const navigate = useNavigate();
  
  if (showAllTransactions || hiddenTransactionsCount === 0) {
    return null;
  }
  
  const handleShowAll = () => {
    if (onShowAll) {
      onShowAll();
    } else {
      navigate('/transactions');
    }
  };

  return (
    <div className="text-center mt-4 space-y-2">
      <p className="text-sm text-muted-foreground">
        {hiddenTransactionsCount} {hiddenTransactionsCount > 1 ? 'transactions masquées' : 'transaction masquée'}
      </p>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleShowAll}
        className="text-sm"
      >
        <Eye className="mr-1 h-3 w-3" />
        Voir toutes les transactions
      </Button>
    </div>
  );
};

export default TransactionFooter;
