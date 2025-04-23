
import React, { Suspense } from 'react';
import DashboardContainer from './DashboardContainer';
import DashboardSkeleton from './DashboardSkeleton';
import BalanceAnimation from './BalanceAnimation';
import AutoProgressNotification from './AutoProgressNotification';
import SubscriptionSynchronizer from '@/components/subscriptions/SubscriptionSynchronizer';

interface DashboardMainProps {
  dashboardReady: boolean;
  username?: string;
  refreshData: () => void;
}

const DashboardMain: React.FC<DashboardMainProps> = ({ dashboardReady, username, refreshData }) => (
  <div className={`transition-opacity duration-500 ${dashboardReady ? 'opacity-100' : 'opacity-0'}`}>
    <Suspense fallback={<DashboardSkeleton username={username || "Préparation..."} />}>
      <DashboardContainer />
    </Suspense>
    <BalanceAnimation position="top-right" />
    <AutoProgressNotification />
    <SubscriptionSynchronizer onSync={(subscription) => {
      console.log("Subscription synchronized:", subscription);
      refreshData();
    }} />
  </div>
);

export default DashboardMain;
