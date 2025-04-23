
import React from 'react';
import { useDashboardLogic } from '@/hooks/dashboard/useDashboardLogic';
import DashboardMain from '../components/dashboard/DashboardMain';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';

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

  if (authLoading || !user) {
    return <DashboardSkeleton username="Chargement..." />;
  }

  if (isInitializing && isFirstLoad) {
    return <DashboardSkeleton username={username || "Chargement..."} />;
  }

  return (
    <DashboardMain
      dashboardReady={dashboardReady}
      username={username}
      refreshData={refreshData}
    />
  );
};

export default Dashboard;
