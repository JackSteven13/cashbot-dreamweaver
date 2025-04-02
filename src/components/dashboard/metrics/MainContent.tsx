
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardTabs from './tabs/DashboardTabs';

interface MainContentProps {
  balance: number;
  subscription: string;
  isNewUser: boolean;
  referrals?: any[];
  isTopReferrer?: boolean;
  canStartSession?: boolean;
  dailySessionCount?: number;
  referralCount?: number;
  referralBonus?: number;
  handleStartSession?: () => void;
  handleWithdrawal?: () => void;
  transactions?: any[];
}

const MainContent: React.FC<MainContentProps> = ({ 
  balance, 
  subscription,
  isNewUser,
  referrals = [],
  isTopReferrer = false,
  canStartSession = true,
  dailySessionCount = 0,
  referralCount = 0,
  referralBonus = 0,
  handleStartSession,
  handleWithdrawal,
  transactions = []
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <Card className="col-span-1 md:col-span-2 animate-fade-in">
      <CardHeader>
        <CardTitle>Tableau de bord interactif</CardTitle>
      </CardHeader>
      <CardContent>
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          subscription={subscription}
          dailySessionCount={dailySessionCount}
          isTopReferrer={isTopReferrer}
          referralCount={referralCount}
          referralBonus={referralBonus}
          isNewUser={isNewUser}
          balance={balance}
          transactions={transactions}
          canStartSession={canStartSession}
          handleStartSession={handleStartSession}
          handleWithdrawal={handleWithdrawal}
        />
      </CardContent>
    </Card>
  );
};

export default MainContent;
