
import React from 'react';
import Button from '@/components/Button';

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
        <h2 className="text-2xl font-semibold text-[#00ff00]">Sessions récentes</h2>
        <Button variant="outline" size="sm" className="border-[#4CAF50] bg-[#2a2a4f] text-[#00ff00] hover:bg-[#1a1a2f]">
          Voir tout l'historique
        </Button>
      </div>
      
      <div className="space-y-4">
        {transactions.map((transaction, index) => (
          <div key={index} className="cyber-card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#4CAF50]">{transaction.date}</span>
              <span className="text-[#00ff00] font-bold">+{transaction.gain}€</span>
            </div>
            <p className="text-sm text-[#cce0cc] italic">{transaction.report}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionsList;
