
import { Routes, Route, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DashboardInitializationEffect from '@/components/dashboard/DashboardInitializationEffect';
import TransactionsPage from '@/pages/dashboard/TransactionsPage';
import ReferralsPage from '@/pages/dashboard/ReferralsPage';
import { useDashboardInitialization } from '@/hooks/dashboard/initialization';
import { useDashboardState } from '@/hooks/dashboard/useDashboardState';
import { useReferralNotifications } from '@/hooks/useReferralNotifications';
import { useTransactionReconciliation } from '@/hooks/useTransactionReconciliation';
import { memo, useEffect, useRef, useMemo, useState } from 'react';

// Composant principal avec stabilité améliorée
const Dashboard = memo(() => {
  const location = useLocation();
  const renderCountRef = useRef(0);
  const initialRenderCompleteRef = useRef(false);
  const [transitionStage, setTransitionStage] = useState('init');
  const prevPathRef = useRef(location.pathname);
  const forcedTransitionRef = useRef(false);
  
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
  
  // Déterminer si nous sommes sur la page des parrainages
  const isReferralsPage = location.pathname === '/dashboard/referrals';
  const isTransactionsPage = location.pathname === '/dashboard/transactions';
  
  // Hook de réconciliation de transactions - Passe une référence stable
  const stableUserData = useMemo(() => userData, [userData?.balance, userData?.transactions?.length]);
  useTransactionReconciliation(stableUserData, isLoading);
  
  // Utiliser notre hook de notifications
  useReferralNotifications();
  
  // Effet pour prévenir les rechargements complets inutiles
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      // Si c'est juste un changement de route interne, ne pas réinitialiser l'état
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);
  
  // Effet pour gérer les transitions de chargement - simplifié et plus réactif
  useEffect(() => {
    const checkConditions = () => {
      // Si l'initialisation est terminée et nous avons les données utilisateur
      if (!isAuthChecking && !authError && isReady && userData?.username && !isChecking) {
        console.log("Conditions remplies pour afficher le dashboard");
        setTransitionStage('ready');
        return true;
      }
      
      // Si nous avons une erreur d'authentification
      if (authError || (!isAuthChecking && !userData?.username && !isLoading)) {
        console.log("Erreur détectée, affichage de l'écran d'erreur");
        setTransitionStage('error');
        return true;
      }
      
      // Sinon, rester en mode chargement
      setTransitionStage('loading');
      return false;
    };
    
    // Vérifier immédiatement
    if (checkConditions()) {
      return;
    }
    
    // Forcer la transition après un certain temps pour éviter les blocages
    const forceTimeout = setTimeout(() => {
      if (transitionStage !== 'ready' && !forcedTransitionRef.current) {
        console.log("Forçage de la transition après délai");
        forcedTransitionRef.current = true;
        
        // Si nous avons des données utilisateur, forcer l'affichage du dashboard
        if (userData && userData.username) {
          setTransitionStage('ready');
        } else {
          // Sinon, montrer l'écran d'erreur
          setTransitionStage('error');
        }
      }
    }, 4000); // Attendre 4 secondes maximum
    
    return () => {
      clearTimeout(forceTimeout);
    };
  }, [isAuthChecking, isLoading, isReady, isChecking, authError, userData, transitionStage]);
  
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
        {/* Écran de chargement visible uniquement si nous sommes en état de chargement */}
        {(transitionStage === 'loading' || transitionStage === 'init') && (
          <div className="absolute inset-0 z-50">
            <DashboardLoading />
          </div>
        )}
        
        {/* Affichage des erreurs */}
        {transitionStage === 'error' && (
          <div className="absolute inset-0 z-40 transition-opacity duration-300 opacity-100">
            <DashboardError errorType={authError ? "auth" : "data"} onRefresh={forceRefresh} />
          </div>
        )}
        
        {/* Contenu principal avec animation d'entrée */}
        {(transitionStage === 'ready') && userData && (
          <div 
            className="transition-opacity duration-300 opacity-100"
          >
            <DashboardLayout
              key={`layout-${renderKey}`}
              username={userData.username}
              subscription={userData.subscription || 'freemium'}
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
                <Route path="referrals" element={
                  <ReferralsPage key={`referrals-${renderKey}`} />
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
