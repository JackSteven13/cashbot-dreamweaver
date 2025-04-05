
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useSummaryPanel } from '@/hooks/useSummaryPanel';
import UserBalanceCard from './userBalanceCard';
import WelcomeMessage from './WelcomeMessage';
import ReferralLink from './ReferralLink';
import ActionButtons from './ActionButtons';

interface SummaryPanelProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void; 
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referralCount?: number;
  referralBonus?: number;
  lastSessionTimestamp?: string;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  isNewUser = false,
  subscription = 'freemium',
  dailySessionCount = 0,
  canStartSession = true,
  referralCount = 0,
  referralBonus = 0,
  lastSessionTimestamp
}) => {
  const {
    displayBalance,
    isButtonDisabled,
    isWithdrawing,
    effectiveSubscription,
    effectiveDailyLimit,
    onWithdraw,
    onBoostClick,
    calculateRemainingSessions,
    getCurrentlyCanStartSession
  } = useSummaryPanel({
    balance,
    subscription,
    handleWithdrawal,
    handleStartSession,
    referralCount
  });

  // Calculate best way to display remaining sessions
  const remainingSessions = calculateRemainingSessions(subscription, dailySessionCount);
  const currentlyCanStartSession = getCurrentlyCanStartSession(canStartSession);

  return (
    <Card className="mb-6 shadow-md border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-4">
        <WelcomeMessage 
          isNewUser={isNewUser} 
          subscription={effectiveSubscription}
          dailySessionCount={dailySessionCount} 
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <UserBalanceCard
            displayBalance={displayBalance}
            subscription={effectiveSubscription}
            dailyLimit={effectiveDailyLimit}
            referralBonus={referralBonus}
            lastSessionTimestamp={lastSessionTimestamp}
            sessionsDisplay={String(remainingSessions)}
          />
          
          <ActionButtons
            canStartSession={currentlyCanStartSession}
            isButtonDisabled={isButtonDisabled}
            isStartingSession={isStartingSession}
            isWithdrawing={isWithdrawing}
            subscription={effectiveSubscription}
            currentBalance={displayBalance}
            dailyLimit={effectiveDailyLimit}
            onBoostClick={() => onBoostClick(canStartSession)}
            onWithdraw={onWithdraw}
          />
          
          <ReferralLink 
            referralLink={referralLink} 
            subscription={effectiveSubscription}
            referralCount={referralCount}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryPanel;
