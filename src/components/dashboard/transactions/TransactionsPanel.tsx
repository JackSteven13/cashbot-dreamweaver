
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/userData';
import TransactionsList from '@/components/dashboard/TransactionsList';

interface TransactionsPanelProps {
  transactions: Transaction[];
  subscription: string;
}

const TransactionsPanel: React.FC<TransactionsPanelProps> = ({ transactions, subscription }) => {
  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm mb-4 md:mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg md:text-xl text-blue-800 dark:text-blue-300">
          Historique des transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionsList 
          transactions={transactions} 
          isNewUser={transactions.length === 0}
          subscription={subscription}
        />
      </CardContent>
    </Card>
  );
};

export default TransactionsPanel;
