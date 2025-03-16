
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
}

const DashboardMetrics = ({ 
  balance, 
  referralLink, 
  isStartingSession, 
  handleStartSession,
  transactions,
  isNewUser = false
}: DashboardMetricsProps) => {
  return (
    <>
      <SummaryPanel 
        balance={balance}
        referralLink={referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        isNewUser={isNewUser}
      />
      
      {transactions.length > 0 ? (
        <TransactionsList transactions={transactions} />
      ) : (
        <div className="neuro-panel p-6 text-center">
          <p className="text-gray-500">Aucune transaction pour le moment. Lancez une session d'analyse pour commencer !</p>
        </div>
      )}
    </>
  );
};

export default DashboardMetrics;
