
import { useCallback } from 'react';
import { useUserDataState, UserFetcherState } from './user/useUserDataState';
import { useUserDataFetching } from './user/useUserDataFetching';
import { useProfileLoader } from './useProfileLoader';
import { useBalanceLoader } from './useBalanceLoader';
import { useDailyReset } from './useDailyReset'; // Ensure correct import
import { UserData } from '@/types/userData';

export interface UserFetcherActions {
  fetchUserData: () => Promise<void>;
  resetDailyCounters: () => Promise<void>;
  setShowLimitAlert: (show: boolean) => void;
}

export type { UserFetcherState };

export const useUserDataFetcher = (): [UserFetcherState, UserFetcherActions] => {
  // Use the state and actions from useUserDataState
  const userDataState = useUserDataState();
  const { 
    updateUserData, 
    setIsLoading, 
    userActions
  } = userDataState;
  
  const { loadUserProfile, isNewUser, setIsNewUser } = useProfileLoader();
  const { loadUserBalance } = useBalanceLoader(setIsNewUser);

  // Modify the updateUserDataWrapper to match the expected signature
  const updateUserDataWrapper = useCallback((newData: Partial<UserData>) => {
    // Convert UserData to UserFetcherState format
    updateUserData(newData);
  }, [updateUserData]);

  const { fetchUserData, resetDailyCounters } = useUserDataFetching(
    loadUserProfile,
    loadUserBalance,
    updateUserDataWrapper,
    setIsLoading,
    isNewUser
  );
  
  // Updated to call useDailyReset without arguments
  useDailyReset();
  
  // Create the return value with proper structure
  const state: UserFetcherState = {
    userData: userDataState.userData,
    isNewUser: userDataState.isNewUser,
    dailySessionCount: userDataState.dailySessionCount,
    showLimitAlert: userDataState.showLimitAlert,
    isLoading: userDataState.isLoading,
    isBotActive: userDataState.isBotActive,
    dailyLimitProgress: userDataState.dailyLimitProgress
  };

  const actions: UserFetcherActions = {
    fetchUserData,
    resetDailyCounters,
    setShowLimitAlert: userActions.setShowLimitAlert
  };

  return [state, actions];
};

export default useUserDataFetcher;
