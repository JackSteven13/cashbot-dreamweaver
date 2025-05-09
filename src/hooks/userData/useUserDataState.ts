
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
  const [isBotActive, setIsBotActive] = useState<boolean>(true); // Initialisation à true pour que le bot soit actif par défaut
  const [dailyLimitProgress, setDailyLimitProgress] = useState<number>(0);

  // Function to update user data
  const updateUserData = useCallback((newData: Partial<UserData>) => {
    setUserData(prevUserData => {
      if (!prevUserData) return newData as UserData;
      return { ...prevUserData, ...newData };
    });
  }, []);

  // User actions
  const userActions = {
    setShowLimitAlert,
    setIsBotActive // Exposer cette méthode dans userActions
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
    setIsNewUser,
    setDailySessionCount,
    setDailyLimitProgress
  };
};

export default useUserDataState;
