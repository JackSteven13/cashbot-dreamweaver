
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardTabs from './tabs/DashboardTabs';

interface MainContentProps {
  balance: number;
  subscription: string;
  isNewUser: boolean;
  referrals?: any[];
  isTopReferrer?: boolean;
  dailySessionCount?: number;
  referralCount?: number;
  referralBonus?: number;
  transactions?: any[];
}

const MainContent: React.FC<MainContentProps> = ({ 
  balance, 
  subscription,
  isNewUser,
  referrals = [],
  isTopReferrer = false,
  dailySessionCount = 0,
  referralCount = 0,
  referralBonus = 0,
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
        />
      </CardContent>
    </Card>
  );
};

export default MainContent;
