
import React from 'react';
import SummaryPanel from '@/components/dashboard/SummaryPanel';
import TransactionsList from '@/components/dashboard/TransactionsList';

interface Transaction {
  date: string;
  gain: number;
  report: string;
}

interface DashboardMetricsProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription: string;
}

const DashboardMetrics = ({ 
  balance, 
  referralLink, 
  isStartingSession, 
  handleStartSession,
  transactions,
  isNewUser = false,
  subscription
}: DashboardMetricsProps) => {
  return (
    <>
      <SummaryPanel 
        balance={balance}
        referralLink={referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        isNewUser={isNewUser}
        subscription={subscription}
      />
      
      {transactions.length > 0 ? (
        <TransactionsList transactions={transactions} />
      ) : (
        <div className="neuro-panel p-6 text-center">
          <p className="text-gray-500">Aucune transaction pour le moment. Le CashBot va bientôt commencer à analyser des publicités pour vous !</p>
        </div>
      )}
    </>
  );
};

export default DashboardMetrics;
