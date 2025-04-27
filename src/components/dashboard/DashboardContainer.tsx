
import React from 'react';
import DashboardHeader from './DashboardHeader';
import DashboardMetrics from './DashboardMetrics';
import DashboardFooter from './DashboardFooter';
import DailyLimitAlert from './DailyLimitAlert';
import DailyLimitEnforcer from './DailyLimitEnforcer';

interface DashboardContainerProps {
  isLoading?: boolean;
  userData: any;
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  transactions: any[];
  isNewUser?: boolean;
  subscription?: string;
  showLimitAlert: boolean;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referrals?: any[];
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({
  isLoading = false,
  userData,
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  transactions,
  isNewUser = false,
  subscription = 'freemium',
  showLimitAlert,
  dailySessionCount = 0,
  canStartSession = true,
  referrals = [],
  lastSessionTimestamp,
  isBotActive = true
}) => {
  return (
    <div className="dashboard-container flex flex-col min-h-screen">
      <DailyLimitEnforcer />
      <DashboardHeader 
        username={userData?.username || userData?.profile?.username || 'Utilisateur'}
        avatar={userData?.profile?.avatar_url}
        subscription={subscription}
      />
      
      <main className="flex-grow p-4 md:p-6">
        {showLimitAlert && (
          <DailyLimitAlert 
            show={showLimitAlert}
            subscription={subscription}
            currentBalance={balance}
            userData={userData}
          />
        )}
        
        <DashboardMetrics 
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
          referrals={referrals}
          lastSessionTimestamp={lastSessionTimestamp}
          isBotActive={isBotActive}
        />
      </main>
      
      <DashboardFooter />
    </div>
  );
};

export default DashboardContainer;
