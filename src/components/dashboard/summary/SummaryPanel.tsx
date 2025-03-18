
import React from 'react';
import UserBalanceCard from './UserBalanceCard';
import ActionButtons from './ActionButtons';
import ReferralLink from './ReferralLink';
import { SystemTerminal } from '@/components/dashboard/terminal';
import WelcomeMessage from './WelcomeMessage';
import { useSummaryPanel } from '@/hooks/useSummaryPanel';

interface SummaryPanelProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  isNewUser?: boolean;
  subscription: string;
  handleWithdrawal?: () => void;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referralCount?: number;
  referralBonus?: number;
}

const SummaryPanel = ({ 
  balance, 
  referralLink, 
  isStartingSession, 
  handleStartSession,
  isNewUser = false,
  subscription,
  handleWithdrawal,
  dailySessionCount = 0,
  canStartSession = true,
  referralCount = 0,
  referralBonus = 0
}: SummaryPanelProps) => {
  
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
    handleStartSession
  });
  
  const currentlyCanStartSession = getCurrentlyCanStartSession(canStartSession);
  const remainingSessions = calculateRemainingSessions(subscription, dailySessionCount);

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
      <WelcomeMessage isNewUser={isNewUser} />
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <UserBalanceCard 
            displayBalance={displayBalance}
            subscription={effectiveSubscription}
            dailyLimit={effectiveDailyLimit}
            sessionsDisplay={subscription === 'freemium' && effectiveSubscription === 'freemium'
              ? `${remainingSessions} session${remainingSessions !== 1 ? 's' : ''} restante${remainingSessions !== 1 ? 's' : ''}`
              : 'Sessions illimitées'}
            referralCount={referralCount}
            referralBonus={referralBonus}
          />
          
          <ActionButtons 
            canStartSession={currentlyCanStartSession}
            isButtonDisabled={isButtonDisabled}
            isStartingSession={isStartingSession}
            isWithdrawing={isWithdrawing}
            subscription={subscription}
            currentBalance={displayBalance}
            dailyLimit={effectiveDailyLimit}
            onBoostClick={() => onBoostClick(canStartSession)}
            onWithdraw={onWithdraw}
          />
          
          <ReferralLink referralLink={referralLink} />
        </div>
        
        <SystemTerminal 
          isNewUser={isNewUser}
          dailyLimit={effectiveDailyLimit}
          subscription={subscription}
          remainingSessions={remainingSessions}
          referralCount={referralCount}
          displayBalance={displayBalance}
          referralBonus={referralBonus}
        />
      </div>
    </div>
  );
};

export default SummaryPanel;
