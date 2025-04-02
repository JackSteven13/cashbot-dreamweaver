
import { useState, useCallback, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import { useDashboardInitialization } from '@/hooks/dashboard/useDashboardInitialization';

const Dashboard = () => {
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [renderKey, setRenderKey] = useState(Date.now());
  const initialRenderComplete = useRef(false);
  
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
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate
  } = useDormancyCheck(userData?.subscription || 'freemium', refreshUserData);
  
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp
  } = useDashboardSessions(
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert,
    resetBalance
  );

  const forceRefresh = useCallback(() => {
    setRenderKey(Date.now());
    refreshUserData().catch(error => console.error("Error refreshing user data:", error));
  }, [refreshUserData]);

  useEffect(() => {
    // Only log on first successful render with data
    if (!initialRenderComplete.current && !isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
      console.log("Dashboard mounted with user data:", userData.username);
      initialRenderComplete.current = true;
    }
  }, [isAuthChecking, isLoading, userData]);

  useEffect(() => {
    if (window.location.pathname === "/dashboard") {
      setSelectedNavItem('dashboard');
    }
  }, []);

  if (isAuthChecking || isLoading || !isReady || isChecking) {
    return <DashboardLoading />;
  }

  if (authError) {
    return <DashboardError errorType="auth" />;
  }

  if (!userData || !userData.username) {
    return <DashboardError errorType="data" onRefresh={forceRefresh} />;
  }

  const renderDashboardContent = () => (
    <>
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
        show={showLimitAlert && !isDormant && !isNewUser} 
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
        lastSessionTimestamp={lastSessionTimestamp}
      />
    </>
  );

  return (
    <DashboardLayout
      key={renderKey}
      username={userData.username}
      subscription={userData.subscription}
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
