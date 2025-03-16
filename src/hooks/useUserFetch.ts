
import { useEffect, useRef, useState, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher } from './useUserDataFetcher';
import { toast } from "@/components/ui/use-toast";
import { verifyAuth, refreshSession } from '@/utils/authUtils';

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
  const retryCount = useRef(0);
  const maxRetries = 3;
  
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  // Simplified data fetching function with exponential backoff retry
  const fetchData = useCallback(async () => {
    if (fetchInProgress.current || !isMounted.current) {
      return;
    }
    
    try {
      fetchInProgress.current = true;
      
      const isAuthValid = await verifyAuth();
      
      if (!isAuthValid) {
        console.log("Auth not valid, attempting refresh...");
        const refreshed = await refreshSession();
        
        if (!refreshed) {
          console.error("Failed to refresh session");
          fetchInProgress.current = false;
          return;
        }
      }
      
      console.log("Fetching user data...");
      await fetchUserData();
      retryCount.current = 0; // Reset retry count on success
      console.log("User data fetched successfully");
      
      fetchInProgress.current = false;
    } catch (error) {
      console.error("Error fetching user data:", error);
      fetchInProgress.current = false;
      
      // Implement retry with exponential backoff
      if (retryCount.current < maxRetries && isMounted.current) {
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 10000);
        console.log(`Retrying in ${delay}ms (attempt ${retryCount.current + 1}/${maxRetries})`);
        
        setTimeout(() => {
          if (isMounted.current) {
            retryCount.current++;
            fetchData();
          }
        }, delay);
      }
    }
  }, [fetchUserData]);

  // Component lifecycle with improved initialization
  useEffect(() => {
    isMounted.current = true;
    fetchInProgress.current = false;
    retryCount.current = 0;
    
    // Initial fetch with progressive delay
    const initialFetch = setTimeout(() => {
      if (isMounted.current) {
        console.log("Starting initial data fetch");
        fetchData();
      }
    }, 1500); // Slightly longer initial delay for better stability
    
    return () => {
      console.log("useUserFetch unmounting");
      isMounted.current = false;
      clearTimeout(initialFetch);
    };
  }, [fetchData]);

  // Safe refetch function with debounce
  const refetchUserData = useCallback(async () => {
    if (!isMounted.current || fetchInProgress.current) {
      return;
    }
    
    console.log("Manual refetch requested");
    const isAuthValid = await verifyAuth();
    
    if (isAuthValid) {
      await fetchData();
    } else {
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
