
import React, { useState } from 'react';
import DashboardContent from './DashboardContent';
import DashboardHeader from './DashboardHeader';
import { UserData } from '@/types/userData';
import { Transaction } from '@/types/userData';
import { Referral } from '@/types/userData';

export interface DashboardContainerProps {
  userData: UserData | null;
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal: () => void;
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription: string;
  showLimitAlert: boolean;
  dailySessionCount: number;
  referrals: Referral[];
  isBotActive?: boolean;
  username?: string;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({
  userData,
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  transactions,
  isNewUser = false,
  subscription = 'freemium',
  showLimitAlert = false,
  dailySessionCount = 0,
  referrals = [],
  isBotActive = true,
  username = "Utilisateur"
}) => {
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  
  // Get user avatar from profile if available
  const userAvatar = userData?.profile?.avatar_url || null;
  
  // Use the explicitly provided username or fall back to userData
  const displayName = username || userData?.username || "Utilisateur";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader 
        username={displayName} 
        subscription={subscription}
        avatar={userAvatar}
      />
      
      <DashboardContent
        balance={balance}
        referralLink={referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        transactions={transactions}
        isNewUser={isNewUser}
        subscription={subscription}
        dailySessionCount={dailySessionCount}
        referrals={referrals}
        showLimitAlert={showLimitAlert}
        isBotActive={isBotActive}
        selectedNavItem={selectedNavItem}
        setSelectedNavItem={setSelectedNavItem}
        username={displayName}
      />
    </div>
  );
};

export default DashboardContainer;
