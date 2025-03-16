
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
        <h2 className="text-2xl font-semibold text-[#1e3a5f]">Sessions récentes</h2>
        <Button variant="outline" size="sm" className="border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68] hover:bg-[#e2e8f0]">
          Voir tout l'historique
        </Button>
      </div>
      
      <div className="space-y-4">
        {transactions.map((transaction, index) => (
          <div key={index} className="cyber-card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#486581]">{transaction.date}</span>
              <span className="text-[#2d5f8a] font-bold">+{transaction.gain}€</span>
            </div>
            <p className="text-sm text-[#334e68] italic">{transaction.report}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionsList;
