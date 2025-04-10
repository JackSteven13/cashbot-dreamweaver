
import React, { useEffect, useState } from 'react';
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
  const [sortedTransactions, setSortedTransactions] = useState<Transaction[]>([]);
  
  // Trier les transactions par date (plus récent en premier) à chaque mise à jour
  useEffect(() => {
    if (safeTransactions.length) {
      // Créer une copie pour éviter de modifier l'original
      const sortedTxs = [...safeTransactions]
        // Filtrer les transactions valides avec des montants positifs
        .filter(tx => 
          tx && tx.date && 
          ((typeof tx.gain === 'number' && tx.gain > 0) || 
          (typeof tx.amount === 'number' && tx.amount > 0))
        )
        // Trier par date décroissante (plus récent en premier)
        .sort((a, b) => {
          // Convertir les dates et comparer (gestion des formats de date)
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
      
      console.log("Transactions triées:", sortedTxs);
      setSortedTransactions(sortedTxs);
    } else {
      setSortedTransactions([]);
    }
  }, [safeTransactions]);
  
  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm mb-4 md:mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg md:text-xl text-blue-800 dark:text-blue-300">
          Historique des transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionsList 
          transactions={sortedTransactions} 
          isNewUser={sortedTransactions.length === 0}
          subscription={subscription}
        />
      </CardContent>
    </Card>
  );
};

export default TransactionsPanel;
