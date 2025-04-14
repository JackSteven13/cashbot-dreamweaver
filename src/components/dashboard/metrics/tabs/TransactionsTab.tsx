
import React from 'react';
import { Button } from '@/components/ui/button';
import SessionCard from '@/components/SessionCard';

interface TransactionsTabProps {
  transactions: Array<{
    gain?: number;
    report?: string;
    date: string;
    amount?: number;
    type?: string;
  }>;
  isNewUser: boolean;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ 
  transactions,
  isNewUser
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {transactions && transactions.length > 0 ? (
        <div className="grid gap-4">
          {transactions.slice(0, 5).map((transaction, index) => (
            <SessionCard 
              key={index}
              gain={transaction.gain || transaction.amount || 0}
              report={transaction.report || transaction.type || ''}
              date={new Date(transaction.date).toLocaleDateString()}
            />
          ))}
          {transactions.length > 5 && (
            <Button variant="outline" className="w-full mt-2">
              Voir toutes les transactions
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p>Aucune transaction à afficher.</p>
          {isNewUser && (
            <p className="mt-2">Commencez à gagner des revenus en lançant votre première session.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;
