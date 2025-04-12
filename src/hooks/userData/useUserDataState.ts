
import { useState, useCallback, useRef } from 'react';
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

export function useUserDataState() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [dailySessionCount, setDailySessionCount] = useState<number>(0);
  const [showLimitAlert, setShowLimitAlert] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBotActive, setIsBotActive] = useState<boolean>(true);
  const [dailyLimitProgress, setDailyLimitProgress] = useState<number>(0);

  const updateUserData = useCallback((newData: Partial<UserFetcherState>) => {
    if (newData.userData !== undefined) setUserData(newData.userData);
    if (newData.isNewUser !== undefined) setIsNewUser(newData.isNewUser);
    if (newData.dailySessionCount !== undefined) setDailySessionCount(newData.dailySessionCount);
    if (newData.showLimitAlert !== undefined) setShowLimitAlert(newData.showLimitAlert);
    if (newData.isLoading !== undefined) setIsLoading(newData.isLoading);
    if (newData.isBotActive !== undefined) setIsBotActive(newData.isBotActive);
    if (newData.dailyLimitProgress !== undefined) setDailyLimitProgress(newData.dailyLimitProgress);
  }, []);

  // Fonctions pour les compteurs
  const incrementSessionCount = useCallback(async (): Promise<void> => {
    setDailySessionCount(prev => {
      const newCount = prev + 1;
      return newCount;
    });
    return Promise.resolve();
  }, []);

  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate = false): Promise<void> => {
    setUserData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        balance: prevData.balance + gain
      };
    });
    return Promise.resolve();
  }, []);

  const resetBalance = useCallback(async (): Promise<void> => {
    setUserData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        balance: 0
      };
    });
    setDailySessionCount(0);
    setDailyLimitProgress(0);
    return Promise.resolve();
  }, []);

  const userActions = {
    incrementSessionCount,
    updateBalance,
    resetBalance,
    setShowLimitAlert,
    setIsBotActive,
    setDailyLimitProgress
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
    setUserData,
    setIsNewUser,
    setDailySessionCount,
    setShowLimitAlert,
    setIsBotActive,
    setDailyLimitProgress
  };
}
