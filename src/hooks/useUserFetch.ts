
import { useEffect, useRef } from 'react';
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
  const [
    { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading },
    { setShowLimitAlert, fetchUserData }
  ] = useUserDataFetcher();

  useEffect(() => {
    // Set isMounted to true when component mounts
    isMounted.current = true;
    
    fetchUserData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted.current = false;
    };
  }, [fetchUserData]);

  // Create a refetch function that can be called to update user data
  const refetchUserData = async () => {
    if (isMounted.current) {
      await fetchUserData();
    }
  };

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
