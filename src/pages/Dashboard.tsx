
import { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { useUserData } from '@/hooks/useUserData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { canStartManualSession, SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';

const Dashboard = () => {
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  
  // Get user data and session management functions from custom hooks
  const {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount
  } = useUserData();
  
  // Session management logic
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal
  } = useDashboardSessions(
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert
  );

  return (
    <DashboardLayout
      username={userData.username}
      subscription={userData.subscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
      {showLimitAlert && userData.subscription === 'freemium' && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertTitle className="text-yellow-800">Limite journalière atteinte</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Vous avez atteint votre limite de gain journalier de {SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS]}€ avec votre compte Freemium. 
            <br />Passez à un forfait supérieur pour augmenter vos gains ou revenez demain.
          </AlertDescription>
        </Alert>
      )}
      
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
      />
    </DashboardLayout>
  );
};

export default Dashboard;
