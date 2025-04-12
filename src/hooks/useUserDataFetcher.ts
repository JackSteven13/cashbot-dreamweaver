
import { useCallback } from 'react';
import { useUserDataState, UserFetcherState } from './user/useUserDataState';
import { useUserDataFetching } from './user/useUserDataFetching';
import { useProfileLoader } from './useProfileLoader';
import { useBalanceLoader } from './useBalanceLoader';
import { useDailyReset } from './useDailyReset';
import { UserData } from '@/types/userData';

export interface UserFetcherActions {
  setShowLimitAlert: (show: boolean) => void;
  fetchUserData: () => Promise<void>;
  resetDailyCounters: () => Promise<void>;
}

export type { UserFetcherState };

export const useUserDataFetcher = (): [UserFetcherState, UserFetcherActions] => {
  // Use the state and actions from useUserDataState
  const userDataState = useUserDataState();
  const { updateUserData, setShowLimitAlert, setIsLoading } = userDataState;
  
  const { loadUserProfile, isNewUser, setIsNewUser } = useProfileLoader();
  const { loadUserBalance } = useBalanceLoader(setIsNewUser);

  const { fetchUserData, resetDailyCounters } = useUserDataFetching(
    loadUserProfile,
    loadUserBalance,
    updateUserData,
    setIsLoading,
    isNewUser
  );
  
  // Utiliser le hook de réinitialisation quotidienne
  useDailyReset(resetDailyCounters, userDataState.isLoading);

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
    setShowLimitAlert,
    fetchUserData,
    resetDailyCounters
  };

  return [state, actions];
};
