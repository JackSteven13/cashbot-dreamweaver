
import { Routes, Route, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DashboardInitializationEffect from '@/components/dashboard/DashboardInitializationEffect';
import { useDashboardInitialization } from '@/hooks/dashboard/useDashboardInitialization';
import { useDashboardState } from '@/hooks/dashboard/useDashboardState';
import { memo } from 'react';

// Utilisation de memo pour éviter les re-rendus inutiles du composant principal
const Dashboard = memo(() => {
  const location = useLocation();
  
  // Utiliser les hooks pour l'état et l'initialisation
  const dashboardState = useDashboardState();
  const initState = useDashboardInitialization();
  
  const {
    selectedNavItem,
    setSelectedNavItem,
    renderKey,
    initialRenderComplete,
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate,
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    forceRefresh,
    isLoading
  } = dashboardState;
  
  const {
    isAuthChecking,
    isReady,
    authError
  } = initState;
  
  // Les conditions d'affichage sont gérées de manière plus robuste
  const isLoading_Combined = isAuthChecking || isLoading || !isReady || isChecking;
  const hasError = authError || (!isLoading_Combined && !userData?.username);
  const canShowDashboard = !isLoading_Combined && !authError && isReady && !isChecking && userData?.username;
  
  // Inclure les effets d'initialisation
  return (
    <>
      <DashboardInitializationEffect
        initialRenderComplete={initialRenderComplete}
        isAuthChecking={isAuthChecking}
        isLoading={isLoading}
        userData={userData}
        pathname={location.pathname}
        setSelectedNavItem={setSelectedNavItem}
      />
      
      {isLoading_Combined && (
        <DashboardLoading />
      )}
      
      {authError && (
        <DashboardError errorType="auth" />
      )}
      
      {!isLoading_Combined && !authError && !isReady && !isChecking && (!userData || !userData.username) && (
        <DashboardError errorType="data" onRefresh={forceRefresh} />
      )}
      
      {canShowDashboard && (
        <DashboardLayout
          key={renderKey}
          username={userData.username}
          subscription={userData.subscription}
          selectedNavItem={selectedNavItem}
          setSelectedNavItem={setSelectedNavItem}
        >
          <Routes>
            <Route index element={
              <DashboardContent
                isDormant={isDormant}
                dormancyData={dormancyData}
                showLimitAlert={showLimitAlert}
                isNewUser={isNewUser}
                userData={userData}
                isStartingSession={isStartingSession}
                handleStartSession={handleStartSession}
                handleWithdrawal={handleWithdrawal}
                dailySessionCount={dailySessionCount}
                handleReactivate={handleReactivate}
                lastSessionTimestamp={lastSessionTimestamp}
              />
            } />
          </Routes>
        </DashboardLayout>
      )}
    </>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
