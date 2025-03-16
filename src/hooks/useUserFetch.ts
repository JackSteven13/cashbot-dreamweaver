import { useEffect, useRef, useState, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher } from './useUserDataFetcher';
import { toast } from "@/components/ui/use-toast";
import { verifyAuth, refreshSession } from "@/utils/auth/index";

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
      retryCount.current = 0;
      console.log("User data fetched successfully");
      
      fetchInProgress.current = false;
    } catch (error) {
      console.error("Error fetching user data:", error);
      fetchInProgress.current = false;
      
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

  useEffect(() => {
    isMounted.current = true;
    fetchInProgress.current = false;
    retryCount.current = 0;
    
    const initialFetch = setTimeout(() => {
      if (isMounted.current) {
        console.log("Starting initial data fetch");
        fetchData();
      }
    }, 1500);
    
    return () => {
      console.log("useUserFetch unmounting");
      isMounted.current = false;
      clearTimeout(initialFetch);
    };
  }, [fetchData]);

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
