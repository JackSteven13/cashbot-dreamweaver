// This file needs to be updated to include the new props from MetricsLayout
// I'll modify the first few lines of this component to include the subscription and onActivateProTrial
import React from 'react';
import MetricsLayout from './metrics/MetricsLayout';
import MainContent from './metrics/MainContent';
import SideContent from './metrics/SideContent';

export interface DashboardMetricsProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => Promise<void>;
  handleWithdrawal: () => Promise<void>;
  transactions: Transaction[];
  referralCount: number;
  referralBonus: number;
  dailyLimit: number;
  subscription: string;
  onActivateProTrial: () => void;
}

interface Transaction {
  id: string;
  amount: number;
  created_at: string;
  status: string;
  type: string;
}

const DashboardMetrics = ({
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  transactions,
  referralCount,
  referralBonus,
  dailyLimit,
  subscription,
  onActivateProTrial
}: DashboardMetricsProps) => {
  
  return (
    <MetricsLayout
      mainContent={
        <MainContent
          balance={balance}
          referralLink={referralLink}
          isStartingSession={isStartingSession}
          handleStartSession={handleStartSession}
          handleWithdrawal={handleWithdrawal}
          transactions={transactions}
        />
      }
      sideContent={
        <SideContent
          referralCount={referralCount}
          referralBonus={referralBonus}
          dailyLimit={dailyLimit}
        />
      }
      subscription={subscription}
      onActivateProTrial={onActivateProTrial}
    />
  );
};

export default DashboardMetrics;
