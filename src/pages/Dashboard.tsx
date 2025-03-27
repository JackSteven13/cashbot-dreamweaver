
import { useState, useCallback, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DailyLimitAlert from '@/components/dashboard/DailyLimitAlert';
import DormancyAlert from '@/components/dashboard/DormancyAlert';
import ToastProvider from '@/components/ToastProvider';
import { useUserData } from '@/hooks/useUserData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { useDormancyCheck } from '@/hooks/useDormancyCheck';
import { canStartManualSession } from '@/utils/subscriptionUtils';
import { useDashboardInitialization } from '@/hooks/useDashboardInitialization';
import SubscriptionSynchronizer from '@/components/subscriptions/SubscriptionSynchronizer';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [renderKey, setRenderKey] = useState(Date.now());
  const [forcedSubscription, setForcedSubscription] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  
  const {
    isAuthChecking,
    isReady,
    authError,
    syncUserData
  } = useDashboardInitialization();
  
  const {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading,
    refreshUserData
  } = useUserData();
  
  // Add dormancy check
  const {
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate
  } = useDormancyCheck(userData?.subscription || 'freemium', refreshUserData);
  
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal
  } = useDashboardSessions(
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert,
    resetBalance
  );

  // Callback to force refresh when needed
  const forceRefresh = useCallback(() => {
    if (!mountedRef.current) return;
    
    setRenderKey(Date.now());
    refreshUserData().catch(error => console.error("Error refreshing user data:", error));
  }, [refreshUserData]);

  // Handle subscription updates from synchronizer
  const handleSubscriptionSync = useCallback((newSubscription: string) => {
    if (!mountedRef.current) return;
    
    console.log("Subscription synchronized:", newSubscription);
    setForcedSubscription(newSubscription);
    if (userData && userData.subscription !== newSubscription) {
      console.log(`Forcing refresh due to subscription change: ${userData.subscription} -> ${newSubscription}`);
      forceRefresh();
    }
  }, [forceRefresh, userData]);

  // One-time check on initial render to detect stale data
  useEffect(() => {
    if (!isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
      console.log("Dashboard mounted with user data:", userData.username);
      
      // Check if subscription from localStorage matches userData
      const storedSubscription = localStorage.getItem('subscription');
      if (storedSubscription && storedSubscription !== userData.subscription) {
        console.log(`Subscription mismatch: localStorage=${storedSubscription}, userData=${userData.subscription}`);
        setForcedSubscription(storedSubscription);
      }
      
      // Force refresh after first load to ensure we have latest data
      setTimeout(forceRefresh, 1000);
    }
  }, [isAuthChecking, isLoading, userData, forceRefresh]);

  // Set mounted flag
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Rediriger vers le tableau de bord principal si l'URL est exactement /dashboard sans sous-route
  useEffect(() => {
    if (window.location.pathname === "/dashboard") {
      setSelectedNavItem('dashboard');
    }
  }, []);

  // Retry mechanism for persistent errors
  useEffect(() => {
    if (authError && !isAuthChecking) {
      // Wait and retry authentication once more
      const timeoutId = setTimeout(() => {
        if (!mountedRef.current) return;
        
        console.log("Retrying authentication after error...");
        if (syncUserData) {
          syncUserData().catch(e => {
            if (!mountedRef.current) return;
            
            console.error("Final sync attempt failed:", e);
            setInitError("Authentication failed after retry");
          });
        }
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [authError, isAuthChecking, syncUserData]);

  // Afficher un loader plus robuste pendant le chargement
  if (isAuthChecking || isLoading || !isReady || isChecking) {
    return (
      <>
        <ToastProvider />
        <DashboardLoading />
      </>
    );
  }

  // Afficher une page d'erreur si l'authentification échoue
  if (authError || initError) {
    return (
      <>
        <ToastProvider />
        <DashboardError errorType="auth" />
      </>
    );
  }

  // Vérification supplémentaire pour userData
  if (!userData || !userData.username) {
    return (
      <>
        <ToastProvider />
        <DashboardError errorType="data" onRefresh={forceRefresh} />
      </>
    );
  }

  // Use forced subscription if available, otherwise use userData.subscription
  const effectiveSubscription = forcedSubscription || userData.subscription || 'freemium';

  // Contenu principal du tableau de bord
  const renderDashboardContent = () => (
    <>
      {/* Synchroniseur d'abonnement forcé pour s'assurer que l'UI est à jour */}
      <SubscriptionSynchronizer 
        onSync={handleSubscriptionSync} 
        forceCheck={true} 
      />
      
      {/* Display dormancy alert if applicable */}
      {isDormant && dormancyData && (
        <DormancyAlert 
          show={isDormant}
          dormancyDays={dormancyData.dormancyDays}
          penalties={dormancyData.penalties}
          originalBalance={dormancyData.originalBalance}
          remainingBalance={dormancyData.remainingBalance}
          reactivationFee={dormancyData.reactivationFee}
          onReactivate={handleReactivate}
        />
      )}
      
      <DailyLimitAlert 
        show={showLimitAlert && !isDormant} 
        subscription={effectiveSubscription}
        currentBalance={userData.balance}
      />
      
      <DashboardMetrics
        balance={userData.balance}
        referralLink={userData.referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        transactions={userData.transactions}
        isNewUser={isNewUser}
        subscription={effectiveSubscription}
        dailySessionCount={dailySessionCount}
        canStartSession={!isDormant && canStartManualSession(effectiveSubscription, dailySessionCount, userData.balance)}
        referrals={userData.referrals}
      />
    </>
  );

  // Simplifié pour supprimer les routes inutiles
  return (
    <>
      <ToastProvider />
      <DashboardLayout
        key={renderKey}
        username={userData.username}
        subscription={effectiveSubscription}
        selectedNavItem={selectedNavItem}
        setSelectedNavItem={setSelectedNavItem}
      >
        <Routes>
          <Route index element={renderDashboardContent()} />
        </Routes>
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
