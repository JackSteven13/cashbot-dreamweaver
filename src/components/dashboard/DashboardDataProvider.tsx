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

  useEffect(() => {
    if (!isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
      console.log("Dashboard mounted with user data:", userData.username);
      
      const storedSubscription = localStorage.getItem('subscription');
      if (storedSubscription && storedSubscription !== userData.subscription) {
        console.log(`Subscription mismatch: localStorage=${storedSubscription}, userData=${userData.subscription}`);
        setForcedSubscription(storedSubscription);
      }
      
      setTimeout(forceRefresh, 1000);
    }
  }, [isAuthChecking, isLoading, userData, forceRefresh]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (authError && !isAuthChecking) {
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

  if (isAuthChecking || isLoading || !isReady || isChecking) {
    return <DashboardLoading />;
  }

  if (authError || initError) {
    return <DashboardError errorType="auth" />;
  }

  if (!userData || !userData.username) {
    return <DashboardError errorType="data" onRefresh={forceRefresh} />;
  }

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
