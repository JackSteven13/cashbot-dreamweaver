
import { useEffect, useRef, useState, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher } from './useUserDataFetcher';
import { toast } from "@/components/ui/use-toast";
import { verifyAndRepairAuth } from '@/utils/authUtils';

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
  const maxRetries = 2; // Reduced to prevent excessive retries
  const retryDelay = useRef(800);
  
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  // Optimized data fetching function with better error handling
  const fetchData = useCallback(async () => {
    if (fetchInProgress.current || !isMounted.current) {
      console.log("Fetch skipped: already in progress or component unmounted");
      return;
    }
    
    try {
      console.log("Starting fetchData in useUserFetch");
      fetchInProgress.current = true;
      
      const isAuthValid = await verifyAndRepairAuth();
      
      if (!isAuthValid) {
        console.error("Invalid authentication state, cannot fetch user data");
        fetchInProgress.current = false;
        return;
      }
      
      await fetchUserData();
      console.log("fetchUserData completed successfully");
      
      if (retryCount > 0) setRetryCount(0);
      retryDelay.current = 800;
      fetchInProgress.current = false;
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      if (retryCount < maxRetries && isMounted.current) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        const backoffTime = retryDelay.current * (nextRetry);
        console.log(`Retrying fetch (${nextRetry}/${maxRetries}) in ${backoffTime}ms`);
        
        setTimeout(() => {
          if (isMounted.current) {
            console.log(`Executing retry ${nextRetry}/${maxRetries}`);
            fetchInProgress.current = false;
            fetchData().catch(e => console.error("Retry failed:", e));
          }
        }, backoffTime);
      } else {
        fetchInProgress.current = false;
        console.log("All retries failed or component unmounted");
      }
    }
  }, [fetchUserData, retryCount, maxRetries]);

  // Simplified component lifecycle with better cleanup
  useEffect(() => {
    isMounted.current = true;
    fetchInProgress.current = false;
    
    // We use a simple debounce to prevent parallel auth checks
    let initialFetchTimeout: NodeJS.Timeout;
    
    const initiateAuthCheck = async () => {
      const isAuthValid = await verifyAndRepairAuth();
      
      if (!isAuthValid || !isMounted.current) {
        console.log("Auth check failed or component unmounted, skipping fetch");
        return;
      }
      
      initialFetchTimeout = setTimeout(() => {
        if (isMounted.current && !fetchInProgress.current) {
          fetchData().catch(e => console.error("Initial fetch failed:", e));
        }
      }, 300);
    };
    
    initiateAuthCheck().catch(e => console.error("Auth check error:", e));
    
    return () => {
      console.log("useUserFetch component unmounting");
      isMounted.current = false;
      if (initialFetchTimeout) clearTimeout(initialFetchTimeout);
    };
  }, [fetchData]);

  // Stable and safe refetch function
  const refetchUserData = useCallback(async () => {
    if (!isMounted.current) {
      console.log("Cannot refetch: component unmounted");
      return;
    }
    
    if (fetchInProgress.current) {
      console.log("Cannot refetch: fetch already in progress");
      return;
    }
    
    console.log("Manually refetching user data");
    const isAuthValid = await verifyAndRepairAuth();
    
    if (isAuthValid) {
      await fetchData();
    } else {
      console.log("Authentication invalid, cannot refetch data");
      toast({
        title: "Problème d'authentification",
        description: "Impossible de rafraîchir vos données. Veuillez vous reconnecter.",
        variant: "destructive"
      });
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
