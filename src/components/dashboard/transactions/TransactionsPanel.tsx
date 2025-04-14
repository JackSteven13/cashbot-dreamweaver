
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import TransactionEmptyState from './TransactionEmptyState';
import TransactionListItem from './TransactionListItem';

interface TransactionsPanelProps {
  transactions: any[];
  isLoading?: boolean;
  isNewUser?: boolean;
  title?: string;
}

const TransactionsPanel: React.FC<TransactionsPanelProps> = ({
  transactions = [],
  isLoading = false,
  isNewUser = false,
  title = "Transactions récentes"
}) => {
  const navigate = useNavigate();
  const refreshKey = Date.now(); // Add a refreshKey for TransactionListItem

  const handleViewAllClick = () => {
    navigate('/dashboard/transactions');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {transactions.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleViewAllClick} className="gap-1">
            Tout voir <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((transaction, index) => (
              <TransactionListItem 
                key={index}
                transaction={transaction}
                refreshKey={refreshKey}
                index={index}
              />
            ))}
          </div>
        ) : (
          <TransactionEmptyState isNewUser={isNewUser} />
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsPanel;
