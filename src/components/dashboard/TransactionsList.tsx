
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
}

const TransactionsList = ({ transactions }: TransactionsListProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#1e3a5f]">Sessions récentes</h2>
        <Button variant="outline" size="sm" className="border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68] hover:bg-[#e2e8f0]">
          Voir l'historique complet
        </Button>
      </div>
      
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
    </div>
  );
};

export default TransactionsList;
