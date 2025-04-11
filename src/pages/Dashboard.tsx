
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
import { memo, useEffect, useRef, useMemo, useState, useLayoutEffect } from 'react';

// Composant principal avec stabilité améliorée
const Dashboard = memo(() => {
  const location = useLocation();
  const renderCountRef = useRef(0);
  const initialRenderCompleteRef = useRef(false);
  const [transitionStage, setTransitionStage] = useState('init');
  const prevPathRef = useRef(location.pathname);
  
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
  
  // Hook de réconciliation de transactions - Passe une référence stable
  const stableUserData = useMemo(() => userData, [userData?.balance, userData?.transactions?.length]);
  useTransactionReconciliation(stableUserData, isLoading);
  
  // Utiliser notre hook de notifications
  useReferralNotifications();
  
  // Effet pour prévenir les rechargements complets inutiles
  useLayoutEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      // Si c'est juste un changement de route interne, ne pas réinitialiser l'état
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);
  
  // Effet pour gérer les transitions de chargement
  useEffect(() => {
    // Utiliser un ID pour annuler les transitions précédentes
    const transitionId = Date.now();
    
    if (isAuthChecking || isLoading || !isReady || isChecking) {
      setTransitionStage('loading');
      return;
    }
    
    if (authError || (!isAuthChecking && !userData?.username)) {
      setTransitionStage('error');
      return;
    }
    
    if (!isAuthChecking && !authError && isReady && userData?.username) {
      // Ajouter une légère transition pour éviter les flashs
      const timer = setTimeout(() => {
        // Vérifier que ce n'est pas une transition obsolète
        if (transitionId === Date.now()) {
          setTransitionStage('ready');
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isAuthChecking, isLoading, isReady, isChecking, authError, userData?.username]);
  
  // Calculer une fois les états composés pour éviter les re-calculs
  const combinedState = useMemo(() => {
    const isLoadingCombined = isAuthChecking || isLoading || !isReady || isChecking;
    const hasError = authError || (!isLoadingCombined && !userData?.username);
    const canShowDashboard = !isLoadingCombined && !authError && isReady && userData?.username;
    
    return {
      isLoadingCombined,
      hasError,
      canShowDashboard
    };
  }, [isAuthChecking, isLoading, isReady, isChecking, authError, userData?.username]);
  
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
        {combinedState.isLoadingCombined && (
          <div className="absolute inset-0 z-50">
            <DashboardLoading />
          </div>
        )}
        
        {/* Affichage des erreurs */}
        {combinedState.hasError && !combinedState.isLoadingCombined && (
          <div className={`absolute inset-0 z-40 transition-opacity duration-300 ${transitionStage === 'error' ? 'opacity-100' : 'opacity-0'}`}>
            <DashboardError errorType={authError ? "auth" : "data"} onRefresh={forceRefresh} />
          </div>
        )}
        
        {/* Contenu principal avec animation d'entrée */}
        {combinedState.canShowDashboard && userData && (
          <div 
            className={`transition-opacity duration-300 ${transitionStage === 'ready' ? 'opacity-100' : 'opacity-0'}`}
          >
            <DashboardLayout
              key={`layout-${renderKey}`}
              username={userData.username}
              subscription={userData.subscription}
              selectedNavItem={selectedNavItem}
              setSelectedNavItem={setSelectedNavItem}
            >
              <Routes>
                <Route path="/" element={
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
                  <TransactionsPage key={`transactions-${renderKey}`} />
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
