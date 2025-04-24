
import React, { useEffect, useState } from 'react';
import { DailyLimitAlert, TransactionsList, UserBalanceCard, ActionNoticePanel } from './';

interface DashboardContentProps {
  userData: any;
  isStartingSession?: boolean;
  handleStartSession?: () => void;
  handleWithdrawal?: () => void;
  isNewUser?: boolean;
  dailySessionCount?: number;
  showLimitAlert?: boolean;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  userData,
  isStartingSession = false,
  handleStartSession = () => {},
  handleWithdrawal = () => {},
  isNewUser = false,
  dailySessionCount = 0,
  showLimitAlert = false,
  lastSessionTimestamp = '',
  isBotActive = true
}) => {
  // Utiliser le bon userId de manière cohérente
  const userId = userData?.profile?.id || userData?.id;
  
  return (
    <div className="space-y-6 md:space-y-8 pt-2 md:pt-4">
      {showLimitAlert && (
        <DailyLimitAlert 
          show={showLimitAlert} 
          subscription={userData?.subscription || 'freemium'} 
          currentBalance={Number(userData?.balance || 0)}
          userData={userData}
        />
      )}
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="col-span-1 xl:col-span-2 space-y-6 md:space-y-8">
          <UserBalanceCard 
            balance={userData?.balance || 0} 
            subscription={userData?.subscription || 'freemium'}
            isStartingSession={isStartingSession}
            onStartSession={handleStartSession}
            onWithdrawal={handleWithdrawal}
            dailySessionCount={dailySessionCount}
            lastSessionTimestamp={lastSessionTimestamp}
            isBotActive={isBotActive}
            userId={userId}
          />
          
          <TransactionsList 
            transactions={userData?.transactions || []} 
            isNewUser={isNewUser} 
            subscription={userData?.subscription || 'freemium'}
          />
        </div>
        
        <div className="xl:col-span-1 space-y-6 md:space-y-8">
          <ActionNoticePanel subscription={userData?.subscription || 'freemium'} />
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
