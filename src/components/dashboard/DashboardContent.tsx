
import React, { useEffect, useState } from 'react';
import { DailyLimitAlert, TransactionsList, UserBalanceCard } from '@/components/dashboard';
import { ActionNoticePanel } from '@/components/dashboard/summary';

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
  const userId = userData?.profile?.id || userData?.id;
  
  return (
    <div className="space-y-6 md:space-y-8 pt-2 md:pt-4">
      <div className="grid grid-cols-1 gap-6 md:gap-8">
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
    </div>
  );
};

export default DashboardContent;
