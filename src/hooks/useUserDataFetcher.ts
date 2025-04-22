
import { useCallback } from 'react';
import { UserFetcherState } from './user/useUserDataState';
import { useUserDataFetching } from './user/useUserDataFetching';
import { useUserDataFetcherState } from './userData/useUserDataFetcherState';
import { useDataLoaders } from './userData/useDataLoaders';
import { useDailyReset } from './useDailyReset';

export interface UserFetcherActions {
  fetchUserData: () => Promise<void>;
  resetDailyCounters: () => Promise<void>;
  setShowLimitAlert: (show: boolean) => void;
}

export type { UserFetcherState };

export const useUserDataFetcher = (): [UserFetcherState, UserFetcherActions] => {
  const { state, updateUserDataWrapper, setIsLoading, userActions, setIsNewUser } = useUserDataFetcherState();
  const { loadUserProfile, loadUserBalance, isNewUser } = useDataLoaders(setIsNewUser);

  const { fetchUserData, resetDailyCounters } = useUserDataFetching(
    loadUserProfile,
    loadUserBalance,
    updateUserDataWrapper,
    setIsLoading,
    isNewUser
  );

  // Initialize daily reset
  useDailyReset();

  const actions: UserFetcherActions = {
    fetchUserData,
    resetDailyCounters,
    setShowLimitAlert: userActions.setShowLimitAlert
  };

  return [state, actions];
};

export default useUserDataFetcher;
