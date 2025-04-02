
import { useState, useRef, useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { UserData } from '@/types/userData';

export interface UserFetcherState {
  userData: UserData;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isNewUser: boolean;
  isLoading: boolean;
}

export const useUserDataState = (initialUserData: UserData = {} as UserData) => {
  // State for tracking user data
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [dailySessionCount, setDailySessionCount] = useState<number>(0);
  const [showLimitAlert, setShowLimitAlert] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Refs for tracking previous values to prevent unnecessary updates
  const previousUserDataRef = useRef<string>('');
  const previousSessionCountRef = useRef<number>(-1);
  const previousLimitAlertRef = useRef<boolean | null>(null);

  // Function to update multiple state values at once
  const updateUserData = useCallback((data: Partial<UserFetcherState>) => {
    if (data.userData !== undefined) setUserData(data.userData);
    if (data.dailySessionCount !== undefined) setDailySessionCount(data.dailySessionCount);
    if (data.showLimitAlert !== undefined) setShowLimitAlert(data.showLimitAlert);
    if (data.isNewUser !== undefined) setIsNewUser(data.isNewUser);
    if (data.isLoading !== undefined) setIsLoading(data.isLoading);
  }, []);

  // Function to set fetched showLimitAlert
  const setFetchedShowLimitAlert = useCallback((show: boolean) => {
    console.log("Setting fetched showLimitAlert to", show);
    setShowLimitAlert(show);
  }, []);

  return {
    // State values
    userData,
    dailySessionCount,
    showLimitAlert,
    isNewUser,
    isLoading,
    
    // State setters
    setUserData,
    setDailySessionCount,
    setShowLimitAlert,
    setIsNewUser,
    setIsLoading,
    
    // Utility functions
    updateUserData,
    setFetchedShowLimitAlert,
    
    // Refs for tracking previous values
    previousUserDataRef,
    previousSessionCountRef,
    previousLimitAlertRef
  };
};
