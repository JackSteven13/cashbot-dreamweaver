
import React from 'react';
import SummaryPanel from './summary/SummaryPanel';
import TransactionsPanel from './transactions/TransactionsPanel';

interface DashboardMetricsProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  transactions: any[];
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referrals?: any[];
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  transactions,
  isNewUser = false,
  subscription,
  dailySessionCount = 0,
  canStartSession = true,
  referrals = [],
  lastSessionTimestamp,
  isBotActive = true
}) => {
  // Calculer les gains issus des parrainages
  const referralBonus = referrals?.reduce((total, ref) => total + (ref.commission_earned || 0), 0) || 0;
  // Compter le nombre de parrainages actifs
  const activeReferralCount = referrals?.filter(ref => ref.active !== false)?.length || 0;
  
  return (
    <div className="dashboard-metrics">
      <SummaryPanel
        balance={balance}
        referralLink={referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        isNewUser={isNewUser}
        subscription={subscription}
        dailySessionCount={dailySessionCount}
        canStartSession={canStartSession}
        referralCount={activeReferralCount}
        referralBonus={referralBonus}
        lastSessionTimestamp={lastSessionTimestamp}
        isBotActive={isBotActive}
      />
      
      <TransactionsPanel
        transactions={transactions}
        subscription={subscription}
      />
    </div>
  );
};

export default DashboardMetrics;
