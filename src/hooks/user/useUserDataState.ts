
import { useState, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { initialUserData } from '@/utils/userDataInitializer';

export interface UserFetcherState {
  userData: UserData;
  isNewUser: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isLoading: boolean;
  isBotActive: boolean;
  dailyLimitProgress: number;
}

export const useUserDataState = () => {
  const [state, setState] = useState<UserFetcherState>({
    userData: initialUserData,
    isNewUser: false,
    dailySessionCount: 0,
    showLimitAlert: false,
    isLoading: true,
    isBotActive: false,
    dailyLimitProgress: 0
  });

  const updateUserData = useCallback((data: Partial<UserFetcherState>) => {
    setState(prev => ({ ...prev, ...data }));
  }, []);

  const setShowLimitAlert = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showLimitAlert: show }));
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const fetchUserData = useCallback(async (): Promise<void> => {
    // Implementation details for fetching user data would go here
    console.log("Fetching user data...");
    // For testing purposes, simulate a successful fetch after a delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  const generateAutomaticRevenue = useCallback(async (forceUpdate: boolean = false): Promise<void> => {
    // Implementation details for generating automatic revenue would go here
    console.log("Generating automatic revenue...");
  }, []);

  const resetDailyCounters = useCallback(async (): Promise<void> => {
    // Implementation details for resetting daily counters would go here
    console.log("Resetting daily counters...");
  }, []);

  // Mock actions for balance operations
  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate: boolean = false): Promise<void> => {
    // Implementation details for updating balance would go here
    console.log(`Updating balance with gain: ${gain}, report: ${report}, forceUpdate: ${forceUpdate}`);
  }, []);

  const resetBalance = useCallback(async (): Promise<void> => {
    // Implementation details for resetting balance would go here
    console.log("Resetting balance...");
  }, []);

  return {
    ...state,
    updateUserData,
    setShowLimitAlert,
    setIsLoading,
    fetchUserData,
    generateAutomaticRevenue,
    userActions: {
      setShowLimitAlert,
      generateAutomaticRevenue,
      resetDailyCounters,
      updateBalance,
      resetBalance
    }
  };
};
