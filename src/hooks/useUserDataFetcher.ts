
import { useCallback } from 'react';
import { useUserDataState, UserFetcherState } from './user/useUserDataState';
import { useUserDataFetching } from './user/useUserDataFetching';
import { useProfileLoader } from './useProfileLoader';
import { useBalanceLoader } from './useBalanceLoader';
import { UserData } from '@/types/userData';

export interface UserFetcherActions {
  setShowLimitAlert: (show: boolean) => void;
  fetchUserData: () => Promise<void>;
}

export type { UserFetcherState };

export const useUserDataFetcher = (): [UserFetcherState, UserFetcherActions] => {
  const userDataState = useUserDataState();
  const { loadUserProfile, isNewUser, setIsNewUser } = useProfileLoader();
  const { loadUserBalance } = useBalanceLoader(setIsNewUser);

  const { fetchUserData } = useUserDataFetching(
    loadUserProfile,
    loadUserBalance,
    userDataState.updateUserData,
    userDataState.setIsLoading,
    isNewUser
  );

  const state: UserFetcherState = {
    userData: userDataState.userData,
    dailySessionCount: userDataState.dailySessionCount,
    showLimitAlert: userDataState.showLimitAlert,
    isNewUser: userDataState.isNewUser,
    isLoading: userDataState.isLoading
  };

  return [
    state,
    {
      setShowLimitAlert: userDataState.setShowLimitAlert,
      fetchUserData
    }
  ];
};
