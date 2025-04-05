
import { useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";
import { useFetchProtection } from './useFetchProtection';
import { useRetryLogic } from './useRetryLogic';
import { useAuthRefresh } from './useAuthRefresh';

/**
 * Hook that handles the data fetching logic
 */
export const useFetchData = (fetchUserData: () => Promise<void>) => {
  const {
    isMounted,
    fetchInProgress,
    retryCount,
    initialFetchAttempted,
    shouldThrottleFetch,
    shouldThrottleRefresh,
    updateFetchTimestamp,
    updateRefreshTimestamp,
    getNextQueueId,
    fetchQueueRef
  } = useFetchProtection();
  
  const { handleFetchError, resetRetryCount } = useRetryLogic(retryCount);
  const { verifyAuthentication, attemptSessionRefresh } = useAuthRefresh();
  
  // Main fetch function
  const fetchData = useCallback(async () => {
    // Protection against too frequent calls
    if (shouldThrottleFetch()) {
      console.log("Skipping fetch - too soon after last fetch");
      return;
    }
    
    // Protection against multiple simultaneous calls
    if (fetchInProgress.current || !isMounted.current) {
      console.log("Fetch already in progress or component unmounted, skipping");
      return;
    }
    
    try {
      // Increment the queue counter
      const currentQueueId = getNextQueueId();
      
      fetchInProgress.current = true;
      updateFetchTimestamp();
      
      // Delay to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if component is still mounted and if this request is the most recent
      if (!isMounted.current || currentQueueId !== fetchQueueRef.current) {
        console.log("Component unmounted or newer fetch request exists, aborting");
        fetchInProgress.current = false;
        return;
      }
      
      // Authentication verification
      const shouldRefresh = shouldThrottleRefresh();
      let isAuthValid = await verifyAuthentication();
      
      if (!isMounted.current || currentQueueId !== fetchQueueRef.current) {
        console.log("Component unmounted during auth check, aborting fetch");
        fetchInProgress.current = false;
        return;
      }
      
      if (!isAuthValid && shouldRefresh) {
        updateRefreshTimestamp();
        const refreshed = await attemptSessionRefresh();
        
        if (!refreshed) {
          console.error("Failed to refresh session");
          fetchInProgress.current = false;
          return;
        }
        
        // Delay after refreshing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Re-check authentication after refresh
        isAuthValid = await verifyAuthentication();
        if (!isAuthValid) {
          console.error("Still not authenticated after refresh");
          fetchInProgress.current = false;
          return;
        }
      }
      
      if (!isMounted.current || currentQueueId !== fetchQueueRef.current) {
        console.log("Component unmounted after auth refresh, aborting fetch");
        fetchInProgress.current = false;
        return;
      }
      
      console.log("Fetching user data...");
      await fetchUserData();
      resetRetryCount();
      initialFetchAttempted.current = true;
      console.log("User data fetched successfully");
      
    } catch (error) {
      handleFetchError(error, isMounted, fetchData);
    } finally {
      fetchInProgress.current = false;
    }
  }, [fetchUserData]);
  
  // Manual refetch function with protection
  const refetchUserData = useCallback(async () => {
    // Prevent too frequent reloads
    if (shouldThrottleFetch()) {
      console.log("Manual refetch rejected - too soon after last fetch");
      return false;
    }
    
    if (!isMounted.current || fetchInProgress.current) {
      return false;
    }
    
    console.log("Manual refetch requested");
    
    try {
      const isAuthValid = await verifyAuthentication();
      
      if (isAuthValid) {
        await fetchData();
        return true;
      } else {
        // Try refresh before giving up
        if (shouldThrottleRefresh()) {
          updateRefreshTimestamp();
          const refreshed = await attemptSessionRefresh();
          
          if (refreshed) {
            // Delay after refresh
            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchData();
            return true;
          }
        }
        
        toast({
          title: "Problème d'authentification",
          description: "Impossible de rafraîchir vos données. Veuillez vous reconnecter.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error during manual refetch:", error);
      return false;
    }
  }, [fetchData]);
  
  return {
    fetchData,
    refetchUserData,
    isMounted,
    initialFetchAttempted,
    initialFetchDelayRef: { current: null as NodeJS.Timeout | null }
  };
};
