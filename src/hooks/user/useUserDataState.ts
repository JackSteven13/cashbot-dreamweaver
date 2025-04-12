
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

  const fetchUserData = useCallback(async () => {
    // Implementation details for fetching user data would go here
    // This function should return a Promise<void>
  }, []);

  const generateAutomaticRevenue = useCallback((forceUpdate: boolean = false) => {
    // Implementation details for generating automatic revenue would go here
  }, []);

  const resetDailyCounters = useCallback(async () => {
    // Implementation details for resetting daily counters would go here
  }, []);

  // Mock actions for balance operations
  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate: boolean = false) => {
    // Implementation details for updating balance would go here
  }, []);

  const resetBalance = useCallback(async () => {
    // Implementation details for resetting balance would go here
  }, []);

  return {
    ...state,
    updateUserData,
    setShowLimitAlert,
    setIsLoading,
    fetchUserData,
    userActions: {
      setShowLimitAlert,
      generateAutomaticRevenue,
      resetDailyCounters,
      updateBalance,
      resetBalance
    }
  };
};
