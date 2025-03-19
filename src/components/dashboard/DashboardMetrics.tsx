
import React from 'react';
import MetricsLayout from './metrics/MetricsLayout';
import MainContent from './metrics/MainContent';
import SideContent from './metrics/SideContent';
import { Transaction } from '@/types/userData';

export interface DashboardMetricsProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => Promise<void>;
  handleWithdrawal: () => Promise<void>;
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount: number;
  canStartSession?: boolean;
  referralCount: number;
  referralBonus: number;
  dailyLimit: number;
  onActivateProTrial: () => void;
}

const DashboardMetrics = ({
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  transactions,
  isNewUser = false,
  subscription,
  dailySessionCount,
  canStartSession = true,
  referralCount,
  referralBonus,
  dailyLimit
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
          isNewUser={isNewUser}
          subscription={subscription}
          dailySessionCount={dailySessionCount}
          canStartSession={canStartSession}
          referralCount={referralCount}
          referralBonus={referralBonus}
        />
      }
      sideContent={
        <SideContent
          balance={balance}
          isNewUser={isNewUser}
          referralCount={referralCount}
          referralBonus={referralBonus}
          dailyLimit={dailyLimit}
        />
      }
      subscription={subscription}
      onActivateProTrial={() => {}}
    />
  );
};

export default DashboardMetrics;
