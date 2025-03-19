
import { useState, useCallback, useEffect } from 'react';
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

const Dashboard = () => {
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [renderKey, setRenderKey] = useState(Date.now()); // Force re-renders when needed
  
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

  // One-time check on initial render to detect stale data
  useEffect(() => {
    if (!isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
      console.log("Dashboard mounted with user data:", userData.username);
    }
  }, [isAuthChecking, isLoading, userData]);

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

  // Enfin, afficher le tableau de bord
  return (
    <DashboardLayout
      key={renderKey}
      username={userData.username}
      subscription={userData.subscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
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
        subscription={userData.subscription}
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
        subscription={userData.subscription}
        dailySessionCount={dailySessionCount}
        canStartSession={!isDormant && canStartManualSession(userData.subscription, dailySessionCount, userData.balance)}
        referrals={userData.referrals}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
