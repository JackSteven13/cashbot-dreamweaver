
import { useEffect, useRef, useState, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher } from './useUserDataFetcher';

interface UserFetchResult {
  userData: UserData;
  isNewUser: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isLoading: boolean;
  setShowLimitAlert: (show: boolean) => void;
  refetchUserData?: () => Promise<void>;
}

export const useUserFetch = (): UserFetchResult => {
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  
  const [
    { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading },
    { setShowLimitAlert, fetchUserData }
  ] = useUserDataFetcher();

  // Create a memoized fetchData function
  const fetchData = useCallback(async () => {
    if (fetchInProgress.current || !isMounted.current) return;
    
    try {
      fetchInProgress.current = true;
      await fetchUserData();
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      fetchInProgress.current = false;
    }
  }, [fetchUserData]);

  useEffect(() => {
    // Set isMounted to true when component mounts
    isMounted.current = true;
    
    // Initial data fetch
    fetchData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  // Create a refetch function that can be called to update user data
  const refetchUserData = useCallback(async () => {
    if (isMounted.current && !fetchInProgress.current) {
      await fetchData();
    }
  }, [fetchData]);

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    setShowLimitAlert,
    refetchUserData
  };
};
