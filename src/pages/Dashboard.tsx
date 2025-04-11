
import { Routes, Route, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DashboardInitializationEffect from '@/components/dashboard/DashboardInitializationEffect';
import TransactionsPage from '@/pages/dashboard/TransactionsPage';
import { useDashboardInitialization } from '@/hooks/dashboard/initialization';
import { useDashboardState } from '@/hooks/dashboard/useDashboardState';
import { useReferralNotifications } from '@/hooks/useReferralNotifications';
import { useTransactionReconciliation } from '@/hooks/useTransactionReconciliation';
import { memo, useEffect, useRef, useMemo, useState } from 'react';

// Composant principal avec transitions améliorées
const Dashboard = memo(() => {
  const location = useLocation();
  const renderCountRef = useRef(0);
  const initialRenderCompleteRef = useRef(false);
  const [transitionStage, setTransitionStage] = useState('init');
  
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
    isLoading,
    isBotActive
  } = useDashboardState();
  
  // Déterminer si nous sommes sur la page des parrainages ou transactions
  const isReferralsPage = location.pathname === '/dashboard/referrals';
  const isTransactionsPage = location.pathname === '/dashboard/transactions';
  
  // Hook de réconciliation de transactions
  useTransactionReconciliation(userData, isLoading);
  
  // Utiliser notre hook de notifications
  useReferralNotifications();
  
  // Effet pour gérer les transitions de chargement
  useEffect(() => {
    if (isAuthChecking || isLoading || !isReady || isChecking) {
      setTransitionStage('loading');
    } else if (authError || (!isAuthChecking && !userData?.username)) {
      setTransitionStage('error');
    } else if (!isAuthChecking && !authError && isReady && userData?.username) {
      // Ajouter une légère transition pour éviter les flashs
      const timer = setTimeout(() => {
        setTransitionStage('ready');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isAuthChecking, isLoading, isReady, isChecking, authError, userData?.username]);
  
  // Effet de debug avec scope limité
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`Dashboard render count: ${renderCountRef.current}`);
  });
  
  // Écouter les événements de mise à jour des parrainages
  useEffect(() => {
    const handleReferralUpdate = () => {
      forceRefresh();
    };
    
    window.addEventListener('referral:update', handleReferralUpdate);
    
    return () => {
      window.removeEventListener('referral:update', handleReferralUpdate);
    };
  }, [forceRefresh]);
  
  // Calculs memoizés pour éviter les re-calculs
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
  
  // Rendu conditionnel avec transitions fluides
  return (
    <>
      {/* Effet d'initialisation */}
      <DashboardInitializationEffect
        initialRenderComplete={initialRenderCompleteRef}
        isAuthChecking={isAuthChecking}
        isLoading={isLoading}
        userData={userData}
        pathname={location.pathname}
        setSelectedNavItem={setSelectedNavItem}
      />
      
      {/* Rendu avec transitions douces entre les états */}
      <div className="relative min-h-screen">
        {/* Écran de chargement avec transition */}
        {isLoading_Combined && (
          <div className="absolute inset-0 z-50">
            <DashboardLoading />
          </div>
        )}
        
        {/* Affichage des erreurs */}
        {hasError && !isLoading_Combined && (
          <div className={`absolute inset-0 z-40 transition-opacity duration-300 ${transitionStage === 'error' ? 'opacity-100' : 'opacity-0'}`}>
            <DashboardError errorType={authError ? "auth" : "data"} onRefresh={forceRefresh} />
          </div>
        )}
        
        {/* Contenu principal avec animation d'entrée */}
        {canShowDashboard && (
          <div 
            className={`transition-opacity duration-300 ${transitionStage === 'ready' ? 'opacity-100' : 'opacity-0'}`}
          >
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
                    isBotActive={isBotActive}
                  />
                } />
                <Route path="transactions" element={
                  <TransactionsPage />
                } />
              </Routes>
            </DashboardLayout>
          </div>
        )}
      </div>
    </>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
