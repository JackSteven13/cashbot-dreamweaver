
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/userData';
import TransactionsList from '../TransactionsList';

interface TransactionsPanelProps {
  transactions: Transaction[];
  isLoading?: boolean;
  isNewUser?: boolean;
  subscription?: string;
}

const TransactionsPanel: React.FC<TransactionsPanelProps> = ({ transactions, isLoading = false, isNewUser = false, subscription = 'freemium' }) => {
  const [showTransactions, setShowTransactions] = useState(true);
  
  return (
    <Card>
      <CardHeader className="px-6 pt-6 pb-2">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Transactions</span>
          <button 
            onClick={() => setShowTransactions(!showTransactions)}
            className="text-sm font-normal text-muted-foreground hover:text-primary transition-colors"
          >
            {showTransactions ? 'Masquer' : 'Afficher'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pt-2">
        {showTransactions && (
          <TransactionsList 
            transactions={transactions} 
            isNewUser={isNewUser}
            subscription={subscription}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsPanel;
