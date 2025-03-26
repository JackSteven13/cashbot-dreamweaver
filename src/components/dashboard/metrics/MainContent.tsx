
import React from 'react';
import SummaryPanel from '../summary/SummaryPanel';
import TransactionsPanel from '../transactions/TransactionsPanel';
import AlphaBadge from '@/components/subscriptions/AlphaBadge';
import { Transaction } from '@/types/userData';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainContentProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referralCount?: number;
  referralBonus?: number;
}

const MainContent: React.FC<MainContentProps> = ({
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  transactions,
  isNewUser = false,
  subscription,
  dailySessionCount = 0,
  canStartSession = true,
  referralCount = 0,
  referralBonus = 0
}) => {
  const isMobile = useIsMobile();
  
  // Afficher le badge Alpha seulement pour les abonnements Alpha
  const showAlphaBadge = subscription === 'alpha';

  return (
    <>
      {showAlphaBadge && <AlphaBadge />}
      
      <SummaryPanel
        balance={balance}
        referralLink={referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        isNewUser={isNewUser}
        subscription={subscription}
        dailySessionCount={dailySessionCount}
        canStartSession={canStartSession}
        referralCount={referralCount}
        referralBonus={referralBonus}
      />
      
      <TransactionsPanel transactions={transactions} />
    </>
  );
};

export default MainContent;
