
import React, { useEffect } from 'react';
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

  // Force a data refresh when dashboard is loaded
  useEffect(() => {
    if (user && !isInitializing) {
      // Add a slight delay to ensure everything is loaded
      const timer = setTimeout(() => {
        refreshData();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, isInitializing, refreshData]);

  // Ajouter cette classe CSS pour éviter le tremblement lors du défilement
  useEffect(() => {
    document.body.classList.add('overflow-y-scroll');
    
    return () => {
      document.body.classList.remove('overflow-y-scroll');
    };
  }, []);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen">
        <DashboardSkeleton username="Chargement..." />
      </div>
    );
  }

  if (isInitializing && isFirstLoad) {
    return (
      <div className="min-h-screen">
        <DashboardSkeleton username={username || "Chargement..."} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardMain
        dashboardReady={dashboardReady}
        username={username}
        refreshData={refreshData}
      />
      {/* Add the invisible component that handles background updates */}
      <DailyBalanceUpdater />
    </div>
  );
};

export default Dashboard;
