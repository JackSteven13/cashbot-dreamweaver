
import { useCallback } from 'react';
import { useUserDataState, UserFetcherState } from '../user/useUserDataState';
import { UserData } from '@/types/userData';

export const useUserDataFetcherState = () => {
  const userDataState = useUserDataState();
  const { updateUserData, setIsLoading, userActions, setIsNewUser } = userDataState;
  
  // Modify the updateUserDataWrapper to match the expected signature
  const updateUserDataWrapper = useCallback((newData: Partial<UserData>) => {
    updateUserData(newData);
  }, [updateUserData]);
  
  const state: UserFetcherState = {
    userData: userDataState.userData,
    isNewUser: userDataState.isNewUser,
    dailySessionCount: userDataState.dailySessionCount,
    showLimitAlert: userDataState.showLimitAlert,
    isLoading: userDataState.isLoading,
    isBotActive: userDataState.isBotActive,
    dailyLimitProgress: userDataState.dailyLimitProgress
  };

  return {
    state,
    updateUserDataWrapper,
    setIsLoading,
    userActions,
    setIsNewUser  // Expose setIsNewUser directly
  };
};
