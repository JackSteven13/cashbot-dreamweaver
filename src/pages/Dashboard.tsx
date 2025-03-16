
import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DailyLimitAlert from '@/components/dashboard/DailyLimitAlert';
import { useUserData } from '@/hooks/useUserData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { canStartManualSession } from '@/utils/subscriptionUtils';
import { useDashboardInitialization } from '@/hooks/useDashboardInitialization';

const Dashboard = () => {
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  
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

  // Afficher un loader plus robuste pendant le chargement
  if (isAuthChecking || isLoading || !isReady) {
    return <DashboardLoading />;
  }

  // Afficher une page d'erreur si l'authentification échoue
  if (authError) {
    return <DashboardError errorType="auth" />;
  }

  // Vérification supplémentaire pour userData
  if (!userData || !userData.username) {
    return <DashboardError errorType="data" onRefresh={refreshUserData} />;
  }

  // Enfin, afficher le tableau de bord
  return (
    <DashboardLayout
      username={userData.username}
      subscription={userData.subscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
      <DailyLimitAlert 
        show={showLimitAlert} 
        subscription={userData.subscription}
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
        canStartSession={canStartManualSession(userData.subscription, dailySessionCount, userData.balance)}
        referrals={userData.referrals}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
