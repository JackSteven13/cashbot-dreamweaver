
import React, { ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { useDormancyCheck } from '@/hooks/useDormancyCheck';
import { useDashboardInitialization } from '@/hooks/useDashboardInitialization';
import { canStartManualSession } from '@/utils/subscriptionUtils';
import SubscriptionSynchronizer from '@/components/subscriptions/SubscriptionSynchronizer';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';

interface DashboardDataContextValue {
  userData: ReturnType<typeof useUserData>['userData'];
  isNewUser: boolean;
  dailySessionCount: number;
  effectiveSubscription: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal: () => void;
  isDormant: boolean;
  dormancyData: any;
  handleReactivate: () => Promise<void>;
  canStartSession: boolean;
  renderKey: number;
  forceRefresh: () => void;
  showLimitAlert: boolean;
}

export const DashboardDataContext = React.createContext<DashboardDataContextValue | null>(null);

interface DashboardDataProviderProps {
  children: ReactNode;
}

export const DashboardDataProvider = ({ children }: DashboardDataProviderProps) => {
  const [renderKey, setRenderKey] = useState(Date.now());
  const [forcedSubscription, setForcedSubscription] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [forcedLoading, setForcedLoading] = useState(false);
  const mountedRef = useRef(true);
  const initialRenderComplete = useRef(false);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log("DashboardDataProvider rendering, renderKey:", renderKey);
  
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

  const forceRefresh = useCallback(() => {
    if (!mountedRef.current) return;
    
    console.log("Forcing dashboard refresh");
    setRenderKey(Date.now());
    refreshUserData().catch(error => console.error("Error refreshing user data:", error));
  }, [refreshUserData]);

  const handleSubscriptionSync = useCallback((newSubscription: string) => {
    if (!mountedRef.current) return;
    
    console.log("Subscription synchronized:", newSubscription);
    setForcedSubscription(newSubscription);
    if (userData && userData.subscription !== newSubscription) {
      console.log(`Forcing refresh due to subscription change: ${userData.subscription} -> ${newSubscription}`);
      forceRefresh();
    }
  }, [forceRefresh, userData]);

  // Ensure we render after a maximum timeout
  useEffect(() => {
    if (!initialRenderComplete.current) {
      initialRenderComplete.current = true;
      
      // Force render after a timeout as a fallback
      readyTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        
        if (isAuthChecking || isLoading || !isReady || isChecking) {
          console.log("Forcing ready state after timeout");
          setForcedLoading(false);
        }
      }, 5000);
    }
    
    return () => {
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
    };
  }, [isAuthChecking, isLoading, isReady, isChecking]);

  useEffect(() => {
    mountedRef.current = true;
    console.log("DashboardDataProvider mounted");
    return () => { 
      console.log("DashboardDataProvider unmounting");
      mountedRef.current = false; 
    };
  }, []);

  // Only show loading state if really needed
  const showLoading = forcedLoading || (isAuthChecking || isLoading || !isReady || isChecking);
  
  if (showLoading) {
    console.log("Dashboard loading state:", { isAuthChecking, isLoading, isReady, isChecking });
    return <DashboardLoading />;
  }

  if (authError || initError) {
    console.log("Dashboard error state:", { authError, initError });
    return <DashboardError errorType="auth" />;
  }

  // Failsafe - make sure we have user data
  if (!userData || !userData.username) {
    console.log("Missing user data, showing error");
    return <DashboardError errorType="data" onRefresh={forceRefresh} />;
  }

  console.log("Dashboard ready to render with user:", userData.username);
  
  const effectiveSubscription = forcedSubscription || userData.subscription || 'freemium';
  
  const canStartSession = !isDormant && canStartManualSession(effectiveSubscription, dailySessionCount, userData.balance);

  const contextValue: DashboardDataContextValue = {
    userData,
    isNewUser,
    dailySessionCount,
    effectiveSubscription,
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    isDormant,
    dormancyData,
    handleReactivate,
    canStartSession,
    renderKey,
    forceRefresh,
    showLimitAlert
  };

  return (
    <>
      <SubscriptionSynchronizer 
        onSync={handleSubscriptionSync} 
        forceCheck={true} 
      />
      <DashboardDataContext.Provider value={contextValue}>
        {children}
      </DashboardDataContext.Provider>
    </>
  );
};

export const useDashboardData = () => {
  const context = React.useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
};
