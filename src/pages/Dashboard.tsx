
import React, { useEffect } from 'react';
import { useDashboardLogic } from '@/hooks/dashboard/useDashboardLogic';
import DashboardMain from '../components/dashboard/DashboardMain';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import DailyBalanceUpdater from '../components/DailyBalanceUpdater';
import balanceManager from '@/utils/balance/balanceManager';

const Dashboard = () => {
  const {
    authLoading,
    user,
    isInitializing,
    isFirstLoad,
    username,
    dashboardReady,
    refreshData
  } = useDashboardLogic();

  // Force a data refresh when dashboard is loaded
  useEffect(() => {
    if (user && !isInitializing) {
      // Set userId in balanceManager
      if (user.id) {
        balanceManager.setUserId(user.id);
      }
      
      // Add a slight delay to ensure everything is loaded
      const timer = setTimeout(() => {
        refreshData();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, isInitializing, refreshData]);

  if (authLoading || !user) {
    return <DashboardSkeleton username="Chargement..." />;
  }

  if (isInitializing && isFirstLoad) {
    return <DashboardSkeleton username={username || "Chargement..."} />;
  }

  return (
    <>
      <DashboardMain
        dashboardReady={dashboardReady}
        username={username}
        refreshData={refreshData}
      />
      {/* Add the invisible component that handles background updates with correct userId */}
      {user?.id && <DailyBalanceUpdater userId={user.id} />}
    </>
  );
};

export default Dashboard;
