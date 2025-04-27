
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
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  // Memoize the refresh function to prevent triggering re-renders
  const handleRefreshData = useCallback(() => {
    if (user && !isInitializing && !initialRefreshDone.current) {
      initialRefreshDone.current = true;
      try {
        refreshData();
      } catch (error) {
        console.error("Failed to refresh dashboard data:", error);
      }
    }
  }, [user, isInitializing, refreshData]);

  // Force a data refresh when dashboard is loaded, but with a stable dependency array
  useEffect(() => {
    // Clear any existing timers to avoid duplicates
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
    
    if (user && !isInitializing && !initialRefreshDone.current) {
      // Add a slight delay to ensure everything is loaded
      const timer = setTimeout(() => {
        handleRefreshData();
      }, 2000);
      
      // Save the timer reference
      refreshTimer.current = timer;
    }
    
    // Cleanup function
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
    };
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
