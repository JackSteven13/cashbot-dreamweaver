
import React from 'react';
import Button from '@/components/Button';
import SessionCard from '@/components/SessionCard';

interface Transaction {
  date: string;
  gain: number;
  report: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  isNewUser?: boolean;
}

const TransactionsList = ({ transactions, isNewUser = false }: TransactionsListProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#1e3a5f]">Sessions récentes</h2>
        {transactions.length > 0 && (
          <Button variant="outline" size="sm" className="border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68] hover:bg-[#e2e8f0]">
            Voir l'historique complet
          </Button>
        )}
      </div>
      
      {transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <SessionCard 
              key={index}
              date={transaction.date}
              gain={transaction.gain}
              report={transaction.report}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-blue-50 rounded-lg border border-blue-100">
          {isNewUser ? (
            <>
              <p className="text-[#334e68] font-medium">Bienvenue sur CashBot !</p>
              <p className="text-[#334e68] mt-2">Le système commencera bientôt à générer des revenus pour vous.</p>
              <p className="text-sm text-[#486581] mt-2">Votre première session sera automatiquement lancée.</p>
            </>
          ) : (
            <>
              <p className="text-[#334e68]">Le système va maintenant commencer à générer des revenus automatiquement.</p>
              <p className="text-sm text-[#486581] mt-2">Aucune action n'est requise de votre part.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
