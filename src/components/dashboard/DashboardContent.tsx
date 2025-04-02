
import React from 'react';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DailyLimitAlert from '@/components/dashboard/DailyLimitAlert';
import DormancyAlert from '@/components/dashboard/DormancyAlert';
import { canStartManualSession } from '@/utils/subscriptionUtils';

interface DashboardContentProps {
  isDormant: boolean;
  dormancyData: any;
  showLimitAlert: boolean;
  isNewUser: boolean;
  userData: any;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal: () => void;
  dailySessionCount: number;
  handleReactivate: () => void;
  lastSessionTimestamp?: string;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  isDormant,
  dormancyData,
  showLimitAlert,
  isNewUser,
  userData,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  dailySessionCount,
  handleReactivate,
  lastSessionTimestamp
}) => {
  if (!userData) return null;
  
  return (
    <>
      {isDormant && dormancyData && (
        <DormancyAlert 
          show={isDormant}
          dormancyDays={dormancyData.dormancyDays}
          penalties={dormancyData.penalties}
          originalBalance={dormancyData.originalBalance}
          remainingBalance={dormancyData.remainingBalance}
          reactivationFee={dormancyData.reactivationFee}
          onReactivate={handleReactivate}
        />
      )}
      
      <DailyLimitAlert 
        show={showLimitAlert && !isDormant && !isNewUser} 
        subscription={userData.subscription}
        currentBalance={userData.balance}
      />
      
      <DashboardMetrics
        balance={userData.balance}
        referralLink={userData.referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        transactions={userData.transactions}
        isNewUser={isNewUser}
        subscription={userData.subscription}
        dailySessionCount={dailySessionCount}
        canStartSession={!isDormant && canStartManualSession(userData.subscription, dailySessionCount, userData.balance)}
        referrals={userData.referrals}
        lastSessionTimestamp={lastSessionTimestamp}
      />
    </>
  );
};

export default DashboardContent;
