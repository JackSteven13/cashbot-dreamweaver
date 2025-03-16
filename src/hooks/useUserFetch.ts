
import { useEffect, useRef, useState, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher } from './useUserDataFetcher';
import { toast } from "@/components/ui/use-toast";

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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  const [
    { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading },
    { setShowLimitAlert, fetchUserData }
  ] = useUserDataFetcher();

  // Create a debounced fetchData function with retry logic
  const fetchData = useCallback(async () => {
    if (fetchInProgress.current || !isMounted.current) return;
    
    try {
      fetchInProgress.current = true;
      await fetchUserData();
      // Reset retry count on success
      if (retryCount > 0) setRetryCount(0);
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying fetch (${nextRetry}/${maxRetries}) in ${backoffTime}ms`);
        
        setTimeout(() => {
          if (isMounted.current) fetchData();
        }, backoffTime);
      } else if (isMounted.current) {
        // Only show error after all retries fail
        toast({
          title: "Erreur de connexion",
          description: "Impossible de charger vos données. Veuillez vérifier votre connexion.",
          variant: "destructive"
        });
      }
    } finally {
      // Don't release lock if retrying, otherwise release it
      if (retryCount >= maxRetries || retryCount === 0) {
        fetchInProgress.current = false;
      }
    }
  }, [fetchUserData, retryCount, maxRetries]);

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

  // Create a refetch function with built-in debounce
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
