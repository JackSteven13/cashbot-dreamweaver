
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/userData';
import TransactionsList from '@/components/dashboard/TransactionsList';

interface TransactionsPanelProps {
  transactions: Transaction[];
  subscription: string;
}

const TransactionsPanel: React.FC<TransactionsPanelProps> = ({ transactions, subscription }) => {
  // S'assurer que transactions est un tableau
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  
  // Filtrer les transactions pour n'afficher que celles avec des valeurs positives
  const filteredTransactions = safeTransactions.filter(tx => 
    (typeof tx.gain === 'number' && tx.gain > 0) || 
    (typeof tx.amount === 'number' && tx.amount > 0)
  );
  
  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm mb-4 md:mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg md:text-xl text-blue-800 dark:text-blue-300">
          Historique des transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionsList 
          transactions={filteredTransactions} 
          isNewUser={filteredTransactions.length === 0}
          subscription={subscription}
        />
      </CardContent>
    </Card>
  );
};

export default TransactionsPanel;
