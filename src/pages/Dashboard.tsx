
import { Routes, Route, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DashboardInitializationEffect from '@/components/dashboard/DashboardInitializationEffect';
import { useDashboardInitialization } from '@/hooks/dashboard/initialization';
import { useDashboardState } from '@/hooks/dashboard/useDashboardState';
import { memo, useEffect, useRef, useMemo } from 'react';

// Composant principal avec memo pour éviter les re-rendus inutiles
const Dashboard = memo(() => {
  const location = useLocation();
  const renderCountRef = useRef(0);
  const initialRenderCompleteRef = useRef(false);
  
  // Hooks stables avec dépendances minimales
  const {
    isAuthChecking,
    isReady,
    authError
  } = useDashboardInitialization();
  
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
  } = useDashboardState();
  
  // Effet de debug avec scope limité
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`Dashboard render count: ${renderCountRef.current}`);
  });
  
  // Calculs memoizés pour éviter les re-calculs à chaque rendu
  const { isLoading_Combined, hasError, canShowDashboard } = useMemo(() => {
    const isLoadingCombined = isAuthChecking || isLoading || !isReady || isChecking;
    const hasErrorValue = authError || (!isLoadingCombined && !userData?.username);
    const canShowDashboardValue = !isLoadingCombined && !authError && isReady && userData?.username;
    
    return {
      isLoading_Combined: isLoadingCombined,
      hasError: hasErrorValue,
      canShowDashboard: canShowDashboardValue
    };
  }, [isAuthChecking, isLoading, isReady, isChecking, authError, userData?.username]);
  
  return (
    <>
      {/* Effet d'initialisation stabilisé et isolé */}
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
