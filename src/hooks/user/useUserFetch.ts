
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataState } from './useUserDataState';
import { useUserAuthChecking } from './useUserAuthChecking';
import { useUserRefetching } from './useUserRefetching';
import { ensureZeroBalanceForNewUser } from '@/utils/userDataInitializer';

export type { UserData };

export interface UserFetchResult {
  userData: UserData;
  isNewUser: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isLoading: boolean;
  setShowLimitAlert: (show: boolean) => void;
  refetchUserData: () => Promise<boolean>;
}

export const useUserFetch = (): UserFetchResult => {
  // Tracking references for state updates
  const isMounted = useRef(true);
  const initialFetchAttempted = useRef(false);
  
  // Use smaller, focused hooks
  const { 
    state, 
    updateUserData, 
    setShowLimitAlert: setStateShowLimitAlert 
  } = useUserDataState();
  
  const { 
    fetchUserData, 
    isLoading, 
    setIsLoading 
  } = useUserAuthChecking(
    isMounted, 
    updateUserData, 
    initialFetchAttempted
  );
  
  const { refetchUserData } = useUserRefetching(
    isMounted,
    fetchUserData
  );
  
  // Extract state values
  const { 
    userData: fetchedUserData, 
    isNewUser, 
    dailySessionCount, 
    showLimitAlert 
  } = state;
  
  // Effect to clean up on unmount
  useEffect(() => {
    console.log("useUserFetch mounting");
    isMounted.current = true;
    
    return () => {
      console.log("useUserFetch unmounting");
      isMounted.current = false;
    };
  }, []);
  
  // Process data for new users
  const sanitizedUserData = ensureZeroBalanceForNewUser(isNewUser, fetchedUserData);
  
  return {
    userData: sanitizedUserData,
    isNewUser,
    dailySessionCount,
    showLimitAlert: isNewUser ? false : showLimitAlert, // Always false for new users
    isLoading: isLoading || !initialFetchAttempted.current,
    setShowLimitAlert: setStateShowLimitAlert,
    refetchUserData
  };
};
