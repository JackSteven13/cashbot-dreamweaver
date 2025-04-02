
import { useState, useRef } from 'react';
import { UserData } from '@/types/userData';

export interface UserDataState {
  userData: UserData;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isNewUser: boolean;
}

export const useUserDataState = (initialUserData: UserData) => {
  // State for tracking user data
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [dailySessionCount, setDailySessionCount] = useState<number>(0);
  const [showLimitAlert, setShowLimitAlert] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  
  // Refs for tracking previous values to prevent unnecessary updates
  const previousUserDataRef = useRef<string>('');
  const previousSessionCountRef = useRef<number>(-1);
  const previousLimitAlertRef = useRef<boolean | null>(null);

  return {
    // State values
    userData,
    dailySessionCount,
    showLimitAlert,
    isNewUser,
    
    // State setters
    setUserData,
    setDailySessionCount,
    setShowLimitAlert,
    setIsNewUser,
    
    // Refs for tracking previous values
    previousUserDataRef,
    previousSessionCountRef,
    previousLimitAlertRef
  };
};
