
import { Routes, Route, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DashboardInitializationEffect from '@/components/dashboard/DashboardInitializationEffect';
import { useDashboardInitialization } from '@/hooks/dashboard/initialization';
import { useDashboardState } from '@/hooks/dashboard/useDashboardState';
import { memo, useEffect, useRef } from 'react';

// Utilisation de memo pour éviter les re-rendus inutiles du composant principal
const Dashboard = memo(() => {
  const location = useLocation();
  const renderCountRef = useRef(0);
  const initialRenderCompleteRef = useRef(false);
  
  // Effet de debug pour compter les rendus
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`Main Dashboard component render count: ${renderCountRef.current}`);
  });
  
  // Utiliser les hooks pour l'état et l'initialisation
  // IMPORTANT: Always declare all hooks at the top level, never conditionally
  const dashboardState = useDashboardState();
  const initState = useDashboardInitialization();
  
  // Destructure all values after all hooks have been called
  const {
    selectedNavItem,
    setSelectedNavItem,
    renderKey,
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
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
  
  // Simplify the display conditions for better stability
  const isLoading_Combined = isAuthChecking || isLoading || !isReady || isChecking;
  const hasError = authError || (!isLoading_Combined && !userData?.username);
  const canShowDashboard = !isLoading_Combined && !authError && isReady && userData?.username;
  
  // Pass everything to the initialization effect
  return (
    <>
      <DashboardInitializationEffect
        initialRenderComplete={initialRenderCompleteRef}
        isAuthChecking={isAuthChecking}
        isLoading={isLoading}
        userData={userData}
        pathname={location.pathname}
        setSelectedNavItem={setSelectedNavItem}
      />
      
      {isLoading_Combined && <DashboardLoading />}
      
      {hasError && <DashboardError errorType={authError ? "auth" : "data"} onRefresh={forceRefresh} />}
      
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
                key={`content-${renderKey}`}
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
