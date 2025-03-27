
import { FC } from 'react';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { useDashboardData } from './DashboardDataProvider';

export const DashboardContent: FC = () => {
  const {
    userData,
    isNewUser,
    effectiveSubscription,
    dailySessionCount,
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    canStartSession
  } = useDashboardData();

  if (!userData) return null;

  return (
    <DashboardMetrics
      balance={userData.balance}
      referralLink={userData.referralLink}
      isStartingSession={isStartingSession}
      handleStartSession={handleStartSession}
      handleWithdrawal={handleWithdrawal}
      transactions={userData.transactions}
      isNewUser={isNewUser}
      subscription={effectiveSubscription}
      dailySessionCount={dailySessionCount}
      canStartSession={canStartSession}
      referrals={userData.referrals}
    />
  );
};

export default DashboardContent;
