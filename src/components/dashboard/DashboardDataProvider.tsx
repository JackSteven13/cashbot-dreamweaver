
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
    return <DashboardLoading />;
  }

  // Afficher une page d'erreur si l'authentification échoue
  if (authError || initError) {
    return <DashboardError errorType="auth" />;
  }

  // Vérification supplémentaire pour userData
  if (!userData || !userData.username) {
    return <DashboardError errorType="data" onRefresh={forceRefresh} />;
  }

  // Use forced subscription if available, otherwise use userData.subscription
  const effectiveSubscription = forcedSubscription || userData.subscription || 'freemium';
  
  // Check if user can start a session
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
    forceRefresh
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

// Hook to use the Dashboard data
export const useDashboardData = () => {
  const context = React.useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
};
