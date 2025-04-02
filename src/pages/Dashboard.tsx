
import { Routes, Route, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DashboardInitializationEffect from '@/components/dashboard/DashboardInitializationEffect';
import { useDashboardInitialization } from '@/hooks/dashboard/initialization';
import { useDashboardState } from '@/hooks/dashboard/useDashboardState';
import { memo, useEffect, useRef, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Composant principal avec memo pour éviter les re-rendus inutiles
const Dashboard = memo(() => {
  const location = useLocation();
  const renderCountRef = useRef(0);
  const initialRenderCompleteRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [forceShowDashboard, setForceShowDashboard] = useState(false);
  
  // Hooks stables avec dépendances minimales
  const {
    isAuthChecking,
    isReady,
    authError
  } = useDashboardInitialization();
  
  const dashboardState = useDashboardState();
  
  // Définir un timeout pour afficher le dashboard même si les données ne sont pas complètes
  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      setForceShowDashboard(true);
    }, 2000); // Afficher le dashboard après 2 secondes maximum
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  
  // Protect against undefined userData
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
  } = dashboardState || {
    selectedNavItem: 'dashboard',
    setSelectedNavItem: () => {},
    renderKey: Date.now(),
    userData: null,
    isNewUser: false,
    dailySessionCount: 0,
    showLimitAlert: false,
    isDormant: false,
    dormancyData: null,
    isChecking: false,
    handleReactivate: () => {},
    isStartingSession: false,
    handleStartSession: () => {},
    handleWithdrawal: () => {},
    lastSessionTimestamp: undefined,
    forceRefresh: () => {},
    isLoading: false
  };
  
  // Effet de debug avec scope limité
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`Dashboard render count: ${renderCountRef.current}`);
  });
  
  // Calculs memoizés pour éviter les re-calculs à chaque rendu
  const { isLoading_Combined, hasError, canShowDashboard } = useMemo(() => {
    const isLoadingCombined = !forceShowDashboard && (isAuthChecking || isLoading || !isReady || isChecking);
    const hasErrorValue = authError || (!isLoadingCombined && !userData?.username && !forceShowDashboard);
    const canShowDashboardValue = forceShowDashboard || (!isLoadingCombined && !authError && isReady && userData?.username);
    
    return {
      isLoading_Combined: isLoadingCombined,
      hasError: hasErrorValue,
      canShowDashboard: canShowDashboardValue
    };
  }, [forceShowDashboard, isAuthChecking, isLoading, isReady, isChecking, authError, userData?.username]);
  
  // Données sécurisées pour le rendu
  const safeUsername = userData?.username || 'utilisateur';
  const safeSubscription = userData?.subscription || 'freemium';
  
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
          username={safeUsername}
          subscription={safeSubscription}
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
                userData={userData || {
                  username: 'utilisateur',
                  balance: 0,
                  subscription: 'freemium',
                  transactions: [],
                  referrals: [],
                  referralLink: ''
                }}
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
