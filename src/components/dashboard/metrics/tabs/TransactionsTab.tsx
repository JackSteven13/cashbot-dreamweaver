
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import SessionCard from '@/components/SessionCard';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '@/types/userData';

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
  const navigate = useNavigate();
  const [formattedTransactions, setFormattedTransactions] = useState<Transaction[]>([]);
  
  // Effectuer un traitement supplémentaire des transactions pour s'assurer qu'elles sont correctement formatées
  useEffect(() => {
    if (Array.isArray(transactions)) {
      // Formatter correctement les transactions
      const processed = transactions.map(tx => ({
        ...tx,
        gain: tx.gain || tx.amount || 0,
        report: tx.report || tx.type || ''
      })).filter(tx => tx.date); // Filtrer les transactions sans date
      
      setFormattedTransactions(processed);
      
      // Journaliser pour le débogage
      console.log(`Transactions traitées (${processed.length}):`, processed);
    } else {
      console.log("Transactions invalides reçues:", transactions);
      setFormattedTransactions([]);
    }
  }, [transactions]);
  
  const handleViewAll = () => {
    navigate('/dashboard/transactions');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {formattedTransactions.length > 0 ? (
        <div className="grid gap-4">
          {formattedTransactions.slice(0, 5).map((transaction, index) => (
            <SessionCard 
              key={`tx-${index}-${transaction.date}`}
              gain={transaction.gain || transaction.amount || 0}
              report={transaction.report || transaction.type || ''}
              date={transaction.date}
            />
          ))}
          {formattedTransactions.length > 5 && (
            <Button variant="outline" className="w-full mt-2" onClick={handleViewAll}>
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
