
import React, { Suspense, useEffect, useState } from 'react';
import DashboardContainer from './DashboardContainer';
import DashboardSkeleton from './DashboardSkeleton';
import BalanceAnimation from './BalanceAnimation';
import AutoProgressNotification from './AutoProgressNotification';
import SubscriptionSynchronizer from '@/components/subscriptions/SubscriptionSynchronizer';
import { useUserFetchRefactored } from '@/hooks/fetch/useUserFetchRefactored';
import { useAuth } from '@/hooks/useAuth';

interface DashboardMainProps {
  dashboardReady: boolean;
  username?: string;
  refreshData: () => void;
}

const DashboardMain: React.FC<DashboardMainProps> = ({ dashboardReady, username, refreshData }) => {
  const { userData, isNewUser, dailySessionCount, showLimitAlert } = useUserFetchRefactored();
  const { user } = useAuth();
  const [isStartingSession, setIsStartingSession] = useState(false);
  
  // Handle starting a session
  const handleStartSession = () => {
    setIsStartingSession(true);
    // Reset after animation completes
    setTimeout(() => setIsStartingSession(false), 2000);
  };
  
  // Handle withdrawal (placeholder)
  const handleWithdrawal = () => {
    console.log('Withdrawal requested');
  };
  
  return (
    <div className={`transition-opacity duration-500 ${dashboardReady ? 'opacity-100' : 'opacity-0'}`}>
      <Suspense fallback={<DashboardSkeleton username={username || "Préparation..."} />}>
        <DashboardContainer 
          userData={userData}
          balance={userData?.balance || 0}
          referralLink={userData?.referralLink || window.location.origin + '/register?ref=user'}
          isStartingSession={isStartingSession}
          handleStartSession={handleStartSession}
          handleWithdrawal={handleWithdrawal}
          transactions={userData?.transactions || []}
          isNewUser={isNewUser}
          subscription={userData?.subscription || 'freemium'}
          showLimitAlert={showLimitAlert}
          dailySessionCount={dailySessionCount}
          referrals={userData?.referrals || []}
          isBotActive={userData?.isBotActive}
        />
      </Suspense>
      <BalanceAnimation position="top-right" />
      <AutoProgressNotification />
      <SubscriptionSynchronizer onSync={(subscription) => {
        console.log("Subscription synchronized:", subscription);
        refreshData();
      }} />
    </div>
  );
};

export default DashboardMain;
