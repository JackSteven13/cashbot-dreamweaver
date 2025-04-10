
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DashboardMetrics from './DashboardMetrics';
import DailyLimitAlert from './DailyLimitAlert';
import DormancyAlert from './DormancyAlert';
import SystemTerminal from './terminal/SystemTerminal';
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';

const DashboardContent = ({
  userData,
  isNewUser,
  isDormant,
  dormancyData,
  showLimitAlert = false,
  handleStartSession,
  isStartingSession,
  handleWithdrawal,
  dailySessionCount = 0,
  handleReactivate,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  // Extract relevant properties to avoid unnecessary re-renders
  const {
    balance = 0,
    subscription = 'freemium',
    username = '',
    referralLink = '',
    transactions = [],
    referrals = []
  } = userData || {};
  
  // Calculate daily limit based on subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculate referral bonus
  const referralBonus = referrals?.reduce((total, ref) => total + (ref.commission_rate || 0), 0) || 0;
  
  // Count active referrals
  const activeReferrals = referrals?.filter(ref => ref.active !== false) || [];
  
  // Convert dailySessionCount to number for components that expect number
  const numericDailySessionCount = typeof dailySessionCount === 'string' 
    ? parseInt(dailySessionCount, 10) 
    : dailySessionCount;
  
  // Ensure dailySessionCount is also available as string for display
  const dailySessionCountStr = numericDailySessionCount.toString();
  
  return (
    <main className="flex-1 overflow-auto py-4">
      <div className="container mx-auto px-2">
        {isDormant && dormancyData && (
          <DormancyAlert
            dormancyData={dormancyData}
            handleReactivate={handleReactivate}
          />
        )}
        
        {showLimitAlert && (
          <DailyLimitAlert
            show={showLimitAlert}
            subscription={subscription}
            currentBalance={balance}
          />
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardMetrics
            balance={balance}
            referralLink={referralLink}
            isStartingSession={isStartingSession}
            handleStartSession={handleStartSession}
            handleWithdrawal={handleWithdrawal}
            transactions={transactions}
            isNewUser={isNewUser}
            subscription={subscription}
            dailySessionCount={dailySessionCountStr}
            canStartSession={!isDormant}
            referrals={referrals}
            lastSessionTimestamp={lastSessionTimestamp}
            isBotActive={isBotActive}
          />
          
          <SystemTerminal
            isNewUser={isNewUser}
            dailyLimit={dailyLimit}
            subscription={subscription}
            remainingSessions={numericDailySessionCount}
            referralCount={activeReferrals.length}
            displayBalance={balance}
            referralBonus={referralBonus}
            lastSessionTimestamp={lastSessionTimestamp}
            isBotActive={isBotActive}
          />
        </div>
      </div>
    </main>
  );
};

export default DashboardContent;
