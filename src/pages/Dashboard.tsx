
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
  
  // Déclarer tous les hooks au niveau supérieur, sans condition
  const dashboardState = useDashboardState();
  const initState = useDashboardInitialization();
  
  // Destructurer toutes les valeurs après l'appel des hooks
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
  
  // Simplifier les conditions d'affichage
  const isLoading_Combined = isAuthChecking || isLoading || !isReady || isChecking;
  const hasError = authError || (!isLoading_Combined && !userData?.username);
  const canShowDashboard = !isLoading_Combined && !authError && isReady && userData?.username;
  
  // Logs de debug pour le rendu
  useEffect(() => {
    console.log("Dashboard render count:", renderCountRef.current);
    console.log("isAuthChecking:", isAuthChecking);
    console.log("isLoading:", isLoading);
    console.log("isReady:", isReady);
    console.log("authError:", authError);
    console.log("canShowDashboard:", canShowDashboard);
  }, [isAuthChecking, isLoading, isReady, authError, canShowDashboard]);
  
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
