
import { Routes, Route, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DashboardInitializationEffect from '@/components/dashboard/DashboardInitializationEffect';
import TransactionsPage from '@/pages/dashboard/TransactionsPage';
import ReferralsPage from '@/pages/dashboard/ReferralsPage';
import { useDashboardInitialization } from '@/hooks/dashboard/initialization'; // Fixed import path
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
  const maxWaitTimeRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Effet pour forcer l'affichage après un délai maximum
  useEffect(() => {
    // Définir un délai maximum d'attente (plus court)
    maxWaitTimeRef.current = setTimeout(() => {
      if (transitionStage === 'loading' || transitionStage === 'init') {
        console.log("FORÇAGE de l'affichage du tableau de bord après délai maximum");
        setTransitionStage('ready');
        forcedTransitionRef.current = true;
      }
    }, 4000); // Délai maximum de 4 secondes (réduit)
    
    return () => {
      if (maxWaitTimeRef.current) {
        clearTimeout(maxWaitTimeRef.current);
      }
    };
  }, [transitionStage]);
  
  // Effet pour gérer les transitions de chargement - simplifié et plus réactif
  useEffect(() => {
    const checkConditions = () => {
      // Si l'authentification a échoué, afficher l'écran d'erreur
      if (authError) {
        console.log("Erreur détectée, affichage de l'écran d'erreur");
        setTransitionStage('error');
        return true;
      }
      
      // Si l'initialisation est terminée et nous avons les données utilisateur (même partielles)
      if (!isAuthChecking && userData) {
        console.log("Conditions suffisantes remplies pour afficher le dashboard");
        setTransitionStage('ready');
        return true;
      }
      
      // Si nous n'avons pas de données utilisateur mais l'authentification est terminée
      if (!isAuthChecking && !userData && !isLoading) {
        console.log("Authentification terminée mais pas de données, affichage de l'écran d'erreur");
        setTransitionStage('error');
        return true;
      }
      
      // Sinon, rester en mode chargement
      return false;
    };
    
    // Vérifier immédiatement
    if (checkConditions()) {
      return;
    }
    
  }, [isAuthChecking, isLoading, isReady, isChecking, authError, userData]);
  
  // Rendu avec transitions douces entre les états
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
        
        {/* Contenu principal avec animation d'entrée - IMPORTANT: ne plus vérifier toutes les conditions */}
        {(transitionStage === 'ready') && (
          <div 
            className="transition-opacity duration-300 opacity-100"
          >
            <DashboardLayout
              key={`layout-${renderKey}`}
              username={userData?.username || 'Utilisateur'}
              subscription={userData?.subscription || 'freemium'}
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
