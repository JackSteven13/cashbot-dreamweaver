
import React, { useEffect, useCallback } from 'react';
import { useDashboardLogic } from '@/hooks/dashboard/useDashboardLogic';
import DashboardMain from '../components/dashboard/DashboardMain';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import DailyBalanceUpdater from '../components/DailyBalanceUpdater';

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

  // Memoize the refresh function to prevent triggering re-renders
  const handleRefreshData = useCallback(() => {
    if (user && !isInitializing) {
      try {
        refreshData();
      } catch (error) {
        console.error("Failed to refresh dashboard data:", error);
      }
    }
  }, [user, isInitializing, refreshData]);

  // Force a data refresh when dashboard is loaded
  useEffect(() => {
    if (user && !isInitializing) {
      // Add a slight delay to ensure everything is loaded
      const timer = setTimeout(() => {
        handleRefreshData();
      }, 2000);
      
      // Clean up function
      return () => clearTimeout(timer);
    }
  }, [user, isInitializing, handleRefreshData]);

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
      {dashboardReady && <DailyBalanceUpdater />}
    </>
  );
};

export default Dashboard;
