
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionsList from '../TransactionsList';

interface TransactionsPanelProps {
  transactions: any[];
  subscription?: string;
  isNewUser?: boolean;
}

const TransactionsPanel: React.FC<TransactionsPanelProps> = ({ 
  transactions = [],
  subscription = 'freemium',
  isNewUser = false
}) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Transactions récentes</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionsList 
          transactions={transactions} 
          isNewUser={isNewUser} 
          subscription={subscription}
        />
      </CardContent>
    </Card>
  );
};

export default TransactionsPanel;
