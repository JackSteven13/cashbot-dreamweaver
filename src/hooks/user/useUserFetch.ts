
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

// Create a default UserData object to prevent undefined errors
const defaultUserData: UserData = {
  username: '',
  balance: 0,
  subscription: 'freemium',
  transactions: [],
  referrals: [],
  referralLink: '',
};

export const useUserFetch = (): UserFetchResult => {
  // Tracking references for state updates
  const isMounted = useRef(true);
  const initialFetchAttempted = useRef(false);
  
  // Use the user data state hook to manage local state
  const userDataState = useUserDataState(defaultUserData);
  
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
    
    // Immediately update with default user data to prevent undefined errors
    userDataState.updateUserData({
      userData: defaultUserData,
      isLoading: true
    });
    
    // Trigger initial fetch when component mounts
    if (!initialFetchAttempted.current) {
      fetchUserData().catch(error => {
        console.error("Error during initial fetch:", error);
      });
    }
    
    return () => {
      console.log("useUserFetch unmounting");
      isMounted.current = false;
    };
  }, [fetchUserData, userDataState.updateUserData]);
  
  // Process data for new users
  const sanitizedUserData = ensureZeroBalanceForNewUser(
    userDataState.isNewUser, 
    userDataState.userData || defaultUserData
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
