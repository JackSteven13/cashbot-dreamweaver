
import { useState } from 'react';
import { UserData, Transaction } from '@/types/userData';
import { initialUserData } from '@/utils/userDataInitializer';

export interface UserFetcherState {
  userData: UserData;
  isNewUser: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isLoading: boolean;
}

export const useUserDataState = () => {
  const [state, setState] = useState<UserFetcherState>({
    userData: initialUserData,
    isNewUser: false,
    dailySessionCount: 0,
    showLimitAlert: false,
    isLoading: true
  });

  const updateUserData = (data: Partial<UserFetcherState>) => {
    setState(prev => ({ ...prev, ...data }));
  };

  const setShowLimitAlert = (show: boolean) => {
    setState(prev => ({ ...prev, showLimitAlert: show }));
  };

  const setIsLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  return {
    state,
    updateUserData,
    setShowLimitAlert,
    setIsLoading
  };
};
