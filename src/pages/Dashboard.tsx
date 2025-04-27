
import React, { useEffect, useCallback, useRef } from 'react';
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

  // Use a ref to track if initial refresh has happened
  const initialRefreshDone = useRef(false);

  // Memoize the refresh function to prevent triggering re-renders
  const handleRefreshData = useCallback(() => {
    if (user && !isInitializing && !initialRefreshDone.current) {
      initialRefreshDone.current = true;
      refreshData();
    }
  }, [user, isInitializing, refreshData]);

  // Force a data refresh when dashboard is loaded, but with a stable dependency array
  useEffect(() => {
    if (user && !isInitializing && !initialRefreshDone.current) {
      // Add a slight delay to ensure everything is loaded
      const timer = setTimeout(handleRefreshData, 1000);
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
      {/* Add the invisible component that handles background updates */}
      <DailyBalanceUpdater />
    </>
  );
};

export default Dashboard;
