
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart, PieChart } from 'lucide-react';
import OverviewTab from './OverviewTab';
import TransactionsTab from './TransactionsTab';
import RevenueTab from './RevenueTab';

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  subscription: string;
  dailySessionCount: number;
  isTopReferrer?: boolean;
  referralCount: number;
  referralBonus: number;
  isNewUser: boolean;
  balance: number;
  transactions: any[];
  canStartSession?: boolean;
  handleStartSession?: () => void;
  handleWithdrawal?: () => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  setActiveTab,
  subscription,
  dailySessionCount,
  isTopReferrer,
  referralCount,
  referralBonus,
  isNewUser,
  balance,
  transactions,
  canStartSession,
  handleStartSession,
  handleWithdrawal
}) => {
  // Convert any "alpha" subscription to "starter"
  const displaySubscription = subscription === "alpha" ? "starter" : subscription;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-3 mb-6">
        <TabsTrigger value="overview" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
          <Activity className="h-4 w-4 mr-2" />
          Aperçu
        </TabsTrigger>
        <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
          <BarChart className="h-4 w-4 mr-2" />
          Transactions
        </TabsTrigger>
        <TabsTrigger value="revenue" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
          <PieChart className="h-4 w-4 mr-2" />
          Revenus
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <OverviewTab
          subscription={subscription}
          dailySessionCount={dailySessionCount}
          isTopReferrer={isTopReferrer}
          referralCount={referralCount}
          referralBonus={referralBonus}
          isNewUser={isNewUser}
          balance={balance}
          handleStartSession={handleStartSession}
          handleWithdrawal={handleWithdrawal}
          canStartSession={canStartSession}
        />
      </TabsContent>
      
      <TabsContent value="transactions">
        <TransactionsTab 
          transactions={transactions || []}
          isNewUser={isNewUser}
        />
      </TabsContent>
      
      <TabsContent value="revenue">
        <RevenueTab 
          currentSubscription={displaySubscription}
          isNewUser={isNewUser}
        />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
