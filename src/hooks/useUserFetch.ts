
import { useEffect, useRef, useState, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher } from './useUserDataFetcher';
import { toast } from "@/components/ui/use-toast";
import { verifyAuth } from '@/utils/authUtils';

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
  
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  // Simplified data fetching function
  const fetchData = useCallback(async () => {
    if (fetchInProgress.current || !isMounted.current) {
      return;
    }
    
    try {
      fetchInProgress.current = true;
      
      const isAuthValid = await verifyAuth();
      
      if (!isAuthValid) {
        fetchInProgress.current = false;
        return;
      }
      
      await fetchUserData();
      fetchInProgress.current = false;
    } catch (error) {
      console.error("Error fetching user data:", error);
      fetchInProgress.current = false;
    }
  }, [fetchUserData]);

  // Simplified component lifecycle
  useEffect(() => {
    isMounted.current = true;
    fetchInProgress.current = false;
    
    // Initial fetch with delay
    const initialFetch = setTimeout(() => {
      if (isMounted.current) {
        fetchData();
      }
    }, 1000);
    
    return () => {
      isMounted.current = false;
      clearTimeout(initialFetch);
    };
  }, [fetchData]);

  // Safe refetch function
  const refetchUserData = useCallback(async () => {
    if (!isMounted.current || fetchInProgress.current) {
      return;
    }
    
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
