
import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DailyLimitAlert from '@/components/dashboard/DailyLimitAlert';
import DormancyAlert from '@/components/dashboard/DormancyAlert';
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
  
  const {
    isAuthChecking,
    isReady,
    authError
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
    setRenderKey(Date.now());
    refreshUserData().catch(error => console.error("Error refreshing user data:", error));
  }, [refreshUserData]);

  // Handle subscription updates from synchronizer
  const handleSubscriptionSync = useCallback((newSubscription: string) => {
    console.log("Subscription synchronized:", newSubscription);
    setForcedSubscription(newSubscription);
    forceRefresh();
  }, [forceRefresh]);

  // One-time check on initial render to detect stale data
  useEffect(() => {
    if (!isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
      console.log("Dashboard mounted with user data:", userData.username);
      // Force refresh after first load to ensure we have latest data
      setTimeout(forceRefresh, 1000);
    }
  }, [isAuthChecking, isLoading, userData, forceRefresh]);

  // Rediriger vers le tableau de bord principal si l'URL est exactement /dashboard sans sous-route
  useEffect(() => {
    if (window.location.pathname === "/dashboard") {
      setSelectedNavItem('dashboard');
    }
  }, []);

  // Afficher un loader plus robuste pendant le chargement
  if (isAuthChecking || isLoading || !isReady || isChecking) {
    return <DashboardLoading />;
  }

  // Afficher une page d'erreur si l'authentification échoue
  if (authError) {
    return <DashboardError errorType="auth" />;
  }

  // Vérification supplémentaire pour userData
  if (!userData || !userData.username) {
    return <DashboardError errorType="data" onRefresh={forceRefresh} />;
  }

  // Use forced subscription if available, otherwise use userData.subscription
  const effectiveSubscription = forcedSubscription || userData.subscription;

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
  );
};

export default Dashboard;
