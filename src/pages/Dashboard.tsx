
import React, { useEffect } from 'react';
import { useDashboardLogic } from '@/hooks/dashboard/useDashboardLogic';
import DashboardMain from '../components/dashboard/DashboardMain';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import DailyBalanceUpdater from '../components/DailyBalanceUpdater';
import balanceManager from '@/utils/balance/balanceManager';
import { useProfileData } from '@/hooks/auth/useProfileData';

const Dashboard = () => {
  const {
    authLoading,
    user,
    isInitializing,
    isFirstLoad,
    username: dashboardUsername,
    dashboardReady,
    refreshData
  } = useDashboardLogic();
  
  const { username: profileUsername, fetchProfileData } = useProfileData();

  // Fetch profile data on component mount
  useEffect(() => {
    if (user?.id && !profileUsername) {
      fetchProfileData(user.id);
    }
  }, [user, profileUsername, fetchProfileData]);

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

  // Try to get the most reliable username
  const displayUsername = profileUsername || dashboardUsername || 
                        user?.user_metadata?.full_name || 
                        (user?.email ? user.email.split('@')[0] : "Utilisateur");

  if (authLoading || !user) {
    return <DashboardSkeleton username="Chargement..." />;
  }

  if (isInitializing && isFirstLoad) {
    return <DashboardSkeleton username={displayUsername || "Chargement..."} />;
  }

  return (
    <>
      <DashboardMain
        dashboardReady={dashboardReady}
        username={displayUsername}
        refreshData={refreshData}
      />
      {/* Add the invisible component that handles background updates with correct userId */}
      {user?.id && <DailyBalanceUpdater userId={user.id} />}
    </>
  );
};

export default Dashboard;
