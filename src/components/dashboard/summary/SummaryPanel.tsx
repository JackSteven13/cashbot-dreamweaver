
import React from 'react';
import UserBalanceCard from './userBalanceCard/UserBalanceCard';
import UserActionsCard from './UserActionsCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface SummaryPanelProps {
  balance: number;
  referralLink: string;
  referralCount?: number;
  referralBonus?: number;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount?: number;
  canStartSession?: boolean;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
  transactions?: any[];
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({
  balance,
  referralLink,
  referralCount = 0,
  referralBonus = 0,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  isNewUser = false,
  subscription,
  dailySessionCount = 0,
  canStartSession = true,
  lastSessionTimestamp,
  isBotActive = true,
  transactions = []
}) => {
  const isMobile = useIsMobile();
  
  // Transformer les props pour le rendu mobile vs desktop
  const renderForMobile = isMobile;
  
  return (
    <div className={`grid ${renderForMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-3 gap-4 md:gap-6'} mb-8`}>
      <div className={renderForMobile ? 'col-span-1' : 'col-span-1 md:col-span-2'}>
        <UserBalanceCard 
          balance={balance}
          referralBonus={referralBonus}
          isNewUser={isNewUser}
          subscription={subscription}
          isBotActive={isBotActive}
          transactions={transactions} // Passer les transactions
        />
      </div>
      
      <div className="col-span-1">
        <UserActionsCard
          isStartingSession={isStartingSession}
          handleStartSession={handleStartSession}
          handleWithdrawal={handleWithdrawal}
          referralLink={referralLink}
          referralCount={referralCount}
          isNewUser={isNewUser}
          dailySessionCount={dailySessionCount}
          subscription={subscription}
          canStartSession={canStartSession}
          lastSessionTimestamp={lastSessionTimestamp}
          balance={balance}
        />
      </div>
    </div>
  );
};

export default SummaryPanel;
