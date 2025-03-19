
import React from 'react';
import { SummaryPanel } from '@/components/dashboard/summary';
import TransactionsList from '@/components/dashboard/TransactionsList';
import RevenueCalculator from '@/components/dashboard/RevenueCalculator';
import { Transaction, Referral } from '@/types/userData';

interface MainContentProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal: () => void;
  transactions: Transaction[];
  isNewUser: boolean;
  subscription: string;
  dailySessionCount: number;
  canStartSession: boolean;
  referralCount: number;
  referralBonus: number;
}

const MainContent = ({
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  transactions,
  isNewUser,
  subscription,
  dailySessionCount,
  canStartSession,
  referralCount,
  referralBonus
}: MainContentProps) => {
  return (
    <>
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
      
      {/* Uniquement pour les nouveaux utilisateurs ou ceux qui ont un abonnement freemium */}
      {(isNewUser || subscription === 'freemium') && (
        <RevenueCalculator 
          currentSubscription={subscription}
          isNewUser={isNewUser}
        />
      )}
      
      <TransactionsList 
        transactions={transactions} 
        isNewUser={isNewUser} 
      />
    </>
  );
};

export default MainContent;
