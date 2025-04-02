
import { useCallback, useRef } from 'react';
import { toast } from "@/components/ui/use-toast";
import { verifyAuth, refreshSession } from "@/utils/auth";
import { UserFetcherState } from './useUserDataState';

export const useUserAuthChecking = (
  isMounted: React.MutableRefObject<boolean>,
  updateUserData: (data: Partial<UserFetcherState>) => void,
  initialFetchAttempted: React.MutableRefObject<boolean>
) => {
  const [isLoading, setIsLoading] = useState(true);
  const fetchInProgress = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const initialFetchDelayRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimestamp = useRef(0);
  const fetchQueueRef = useRef<number>(0);
  const lastRefreshTimestamp = useRef(0);
  
  const fetchUserData = useCallback(async () => {
    // Protection against too frequent calls
    const now = Date.now();
    if (now - lastFetchTimestamp.current < 3000) {
      console.log("Skipping fetch - too soon after last fetch");
      return;
    }
    
    // Protection against concurrent calls
    if (fetchInProgress.current || !isMounted.current) {
      console.log("Fetch already in progress or component unmounted, skipping");
      return;
    }
    
    try {
      // Queue management
      fetchQueueRef.current++;
      const currentQueueId = fetchQueueRef.current;
      
      fetchInProgress.current = true;
      lastFetchTimestamp.current = now;
      
      // Delay to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if component is still mounted and this is still the latest request
      if (!isMounted.current || currentQueueId !== fetchQueueRef.current) {
        console.log("Component unmounted or newer fetch request exists, aborting");
        fetchInProgress.current = false;
        return;
      }
      
      // Auth verification with throttling
      const shouldRefresh = now - lastRefreshTimestamp.current > 30000; // 30s between refreshes
      let isAuthValid = await verifyAuth();
      
      if (!isMounted.current || currentQueueId !== fetchQueueRef.current) {
        console.log("Component unmounted during auth check, aborting fetch");
        fetchInProgress.current = false;
        return;
      }
      
      if (!isAuthValid && shouldRefresh) {
        console.log("Auth not valid, attempting refresh...");
        lastRefreshTimestamp.current = now;
        const refreshed = await refreshSession();
        
        if (!refreshed) {
          console.error("Failed to refresh session");
          fetchInProgress.current = false;
          return;
        }
        
        // Delay after refresh
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify auth again after refresh
        isAuthValid = await verifyAuth();
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
      // Here we would call the actual data fetching, but it's been extracted to a separate hook
      // We're just updating state here
      updateUserData({
        isLoading: false
      });
      
      retryCount.current = 0;
      initialFetchAttempted.current = true;
      console.log("User data fetched successfully");
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      if (retryCount.current < maxRetries && isMounted.current) {
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 8000);
        console.log(`Retrying in ${delay}ms (attempt ${retryCount.current + 1}/${maxRetries})`);
        
        setTimeout(() => {
          if (isMounted.current) {
            retryCount.current++;
            fetchUserData();
          }
        }, delay);
      } else if (isMounted.current) {
        initialFetchAttempted.current = true;
        toast({
          title: "Problème de connexion",
          description: "Impossible de charger vos données. Veuillez rafraîchir la page.",
          variant: "destructive"
        });
      }
    } finally {
      fetchInProgress.current = false;
    }
  }, [isMounted, updateUserData, initialFetchAttempted]);

  // Don't include the initialization effect here as it belongs in the main hook
  
  return {
    fetchUserData,
    isLoading,
    setIsLoading
  };
};

// Add missing import
import { useState } from 'react';
