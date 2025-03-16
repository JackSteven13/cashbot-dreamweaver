
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
}

const DashboardMetrics = ({ 
  balance, 
  referralLink, 
  isStartingSession, 
  handleStartSession,
  transactions
}: DashboardMetricsProps) => {
  return (
    <>
      <SummaryPanel 
        balance={balance}
        referralLink={referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
      />
      
      <TransactionsList transactions={transactions} />
    </>
  );
};

export default DashboardMetrics;
