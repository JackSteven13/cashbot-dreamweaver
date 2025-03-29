
import React from 'react';
import { calculateReferralBonus } from '@/utils/referralUtils';
import { MetricsLayout, MainContent, SideContent } from '@/components/dashboard/metrics';
import { Transaction, Referral } from '@/types/userData';

interface DashboardMetricsProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal: () => void;
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referrals?: Referral[];
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
  dailySessionCount = 0,
  canStartSession = true,
  referrals = []
}: DashboardMetricsProps) => {
  // Calculate referral bonus for display
  const referralBonus = calculateReferralBonus(referrals.length);
  const isTopReferrer = referrals.length > 5; // Example condition for top referrer

  return (
    <MetricsLayout
      mainContent={
        <MainContent
          balance={balance}
          subscription={subscription}
          isNewUser={isNewUser}
          referrals={referrals}
          isTopReferrer={isTopReferrer}
          referralCount={referrals.length}
          referralBonus={referralBonus}
        />
      }
      sideContent={
        <SideContent
          balance={balance}
          isNewUser={isNewUser}
          referralBonus={referralBonus}
        />
      }
    />
  );
};

export default DashboardMetrics;
