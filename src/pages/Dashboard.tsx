
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
  
  // Use ref to ensure we don't create multiple timers
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialRefreshed = useRef<boolean>(false);

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

  // Force a data refresh when dashboard is loaded - using refs to avoid re-renders
  useEffect(() => {
    // Only run this effect once when conditions are met
    if (user && !isInitializing && !hasInitialRefreshed.current) {
      hasInitialRefreshed.current = true;
      
      // Clear any existing timer to prevent memory leaks
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      // Add a slight delay to ensure everything is loaded
      refreshTimerRef.current = setTimeout(() => {
        handleRefreshData();
        refreshTimerRef.current = null;
      }, 2000);
    }
    
    // Clean up function - important to prevent memory leaks
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
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
