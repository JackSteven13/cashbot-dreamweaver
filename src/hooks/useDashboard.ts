
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/types/userData';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardState {
  selectedNavItem: string;
  renderKey: number;
  userData: UserData | null;
  isNewUser: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isDormant: boolean;
  dormancyData: any;
  isChecking: boolean;
  isStartingSession: boolean;
  lastSessionTimestamp: string;
  isLoading: boolean;
  isBotActive: boolean;
}

export const useDashboard = () => {
  const { user } = useAuth();
  const [selectedNavItem, setSelectedNavItem] = useState<string>('overview');
  const [renderKey, setRenderKey] = useState<number>(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [dailySessionCount, setDailySessionCount] = useState<number>(0);
  const [showLimitAlert, setShowLimitAlert] = useState<boolean>(false);
  const [isDormant, setIsDormant] = useState<boolean>(false);
  const [dormancyData, setDormancyData] = useState<any>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isStartingSession, setIsStartingSession] = useState<boolean>(false);
  const [lastSessionTimestamp, setLastSessionTimestamp] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBotActive, setIsBotActive] = useState<boolean>(false);
  
  // Force refresh
  const forceRefresh = useCallback(() => {
    setRenderKey(prev => prev + 1);
  }, []);
  
  // Handle start session
  const handleStartSession = useCallback(() => {
    console.log("Starting session...");
    setIsStartingSession(true);
    // Implementation logic would go here
    setTimeout(() => {
      setIsStartingSession(false);
    }, 2000);
  }, []);
  
  // Handle withdrawal
  const handleWithdrawal = useCallback(() => {
    console.log("Processing withdrawal...");
    // Implementation logic would go here
  }, []);
  
  // Handle reactivate
  const handleReactivate = useCallback(() => {
    console.log("Reactivating account...");
    // Implementation logic would go here
    setIsDormant(false);
  }, []);
  
  return {
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
  };
};

export default useDashboard;
