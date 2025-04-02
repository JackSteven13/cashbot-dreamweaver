
import { Routes, Route, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DashboardInitializationEffect from '@/components/dashboard/DashboardInitializationEffect';
import { useDashboardInitialization } from '@/hooks/dashboard/useDashboardInitialization';
import { useDashboardState } from '@/hooks/dashboard/useDashboardState';

const Dashboard = () => {
  const location = useLocation();
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
  } = useDashboardState();
  
  const {
    isAuthChecking,
    isReady,
    authError
  } = useDashboardInitialization();
  
  // Include the initialization effects
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
      
      {(isAuthChecking || isLoading || !isReady || isChecking) && (
        <DashboardLoading />
      )}
      
      {authError && (
        <DashboardError errorType="auth" />
      )}
      
      {!isAuthChecking && !isLoading && !authError && !isReady && !isChecking && (!userData || !userData.username) && (
        <DashboardError errorType="data" onRefresh={forceRefresh} />
      )}
      
      {!isAuthChecking && !isLoading && !authError && isReady && !isChecking && userData && userData.username && (
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
};

export default Dashboard;
