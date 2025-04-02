
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
  
  // Use the user data state hook to manage local state
  const userDataState = useUserDataState();
  
  // Handle authentication checks
  const { 
    fetchUserData, 
    isLoading, 
    setIsLoading 
  } = useUserAuthChecking(
    isMounted, 
    userDataState.updateUserData,
    initialFetchAttempted
  );
  
  // Add refetching capability
  const { refetchUserData } = useUserRefetching(
    isMounted,
    fetchUserData
  );
  
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
  const sanitizedUserData = ensureZeroBalanceForNewUser(
    userDataState.isNewUser, 
    userDataState.userData
  );
  
  return {
    userData: sanitizedUserData,
    isNewUser: userDataState.isNewUser,
    dailySessionCount: userDataState.dailySessionCount,
    showLimitAlert: userDataState.isNewUser ? false : userDataState.showLimitAlert, // Always false for new users
    isLoading: isLoading || !initialFetchAttempted.current,
    setShowLimitAlert: userDataState.setFetchedShowLimitAlert,
    refetchUserData
  };
};
