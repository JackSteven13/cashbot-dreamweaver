
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
  username: 'utilisateur',
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
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Effect to clean up on unmount and initialize data
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
        
        // If fetch fails, ensure we're not stuck in loading state
        if (isMounted.current) {
          setIsLoading(false);
          userDataState.updateUserData({
            userData: defaultUserData,
            isLoading: false
          });
        }
      });
      
      // Set a shorter timeout to ensure we don't get stuck in loading state (reduced from 8s to 3s)
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMounted.current && isLoading) {
          console.log("Fetch timeout reached, using default data");
          setIsLoading(false);
          userDataState.updateUserData({
            userData: defaultUserData,
            isLoading: false
          });
        }
      }, 3000); // 3 second timeout (reduced from 8s)
    }
    
    return () => {
      console.log("useUserFetch unmounting");
      isMounted.current = false;
      
      // Clear any pending timeouts
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [fetchUserData, userDataState.updateUserData, isLoading, setIsLoading]);
  
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
    isLoading: isLoading && (!userDataState.userData?.username || userDataState.userData.username === ''),
    setShowLimitAlert: userDataState.setFetchedShowLimitAlert,
    refetchUserData
  };
};
