
import { useState, useCallback } from 'react';
import { UserData } from '@/types/userData';

export interface UserFetcherState {
  userData: UserData | null;
  isNewUser: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isLoading: boolean;
  isBotActive: boolean;
  dailyLimitProgress: number;
}

export const useUserDataState = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [dailySessionCount, setDailySessionCount] = useState<number>(0);
  const [showLimitAlert, setShowLimitAlert] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBotActive, setIsBotActive] = useState<boolean>(false);
  const [dailyLimitProgress, setDailyLimitProgress] = useState<number>(0);

  // Function to update user data
  const updateUserData = useCallback((newData: Partial<UserFetcherState>) => {
    if (newData.userData) {
      setUserData(prevUserData => {
        if (!prevUserData) return newData.userData as UserData;
        return { ...prevUserData, ...newData.userData };
      });
    }
    
    if (newData.isNewUser !== undefined) setIsNewUser(newData.isNewUser);
    if (newData.dailySessionCount !== undefined) setDailySessionCount(newData.dailySessionCount);
    if (newData.showLimitAlert !== undefined) setShowLimitAlert(newData.showLimitAlert);
    if (newData.isBotActive !== undefined) setIsBotActive(newData.isBotActive);
    if (newData.dailyLimitProgress !== undefined) setDailyLimitProgress(newData.dailyLimitProgress);
  }, []);

  // User actions
  const userActions = {
    setShowLimitAlert,
    setIsBotActive
  };

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    isBotActive,
    dailyLimitProgress,
    userActions,
    updateUserData,
    setIsLoading,
    setIsNewUser
  };
};

export default useUserDataState;
