
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
  const { state, updateUserData, setShowLimitAlert, setIsLoading } = useUserDataState();
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
  useDailyReset(resetDailyCounters, state.isLoading);

  return [
    state,
    {
      setShowLimitAlert,
      fetchUserData,
      resetDailyCounters
    }
  ];
};
