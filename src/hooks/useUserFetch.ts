
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher, UserFetcherState } from './useUserDataFetcher';
import { toast } from "@/components/ui/use-toast";
// Utiliser les importations spécifiques pour éviter les conflits
import { verifyAuth } from "@/utils/auth/index";
import { refreshSession } from "@/utils/auth/index";
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

export const useUserFetch = (): UserFetchResult => {
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 5;
  const initialFetchDelayRef = useRef<NodeJS.Timeout | null>(null);
  const initialFetchAttempted = useRef(false);
  const lastFetchTimestamp = useRef(0);
  
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData: fetchedUserData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  const fetchData = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTimestamp.current < 2000) {
      console.log("Skipping fetch - too soon after last fetch");
      return;
    }
    
    if (fetchInProgress.current || !isMounted.current) {
      console.log("Fetch already in progress or component unmounted, skipping");
      return;
    }
    
    try {
      fetchInProgress.current = true;
      lastFetchTimestamp.current = now;
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const isAuthValid = await verifyAuth();
      
      if (!isMounted.current) {
        console.log("Component unmounted during auth check, aborting fetch");
        fetchInProgress.current = false;
        return;
      }
      
      if (!isAuthValid) {
        console.log("Auth not valid, attempting refresh...");
        const refreshed = await refreshSession();
        
        if (!refreshed) {
          console.error("Failed to refresh session");
          fetchInProgress.current = false;
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      if (!isMounted.current) {
        console.log("Component unmounted after auth refresh, aborting fetch");
        fetchInProgress.current = false;
        return;
      }
      
      console.log("Fetching user data...");
      await fetchUserData();
      retryCount.current = 0;
      initialFetchAttempted.current = true;
      console.log("User data fetched successfully");
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      if (retryCount.current < maxRetries && isMounted.current) {
        const delay = Math.min(1000 * Math.pow(1.5, retryCount.current), 8000);
        console.log(`Retrying in ${delay}ms (attempt ${retryCount.current + 1}/${maxRetries})`);
        
        setTimeout(() => {
          if (isMounted.current) {
            retryCount.current++;
            fetchData();
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
  }, [fetchUserData]);

  useEffect(() => {
    console.log("useUserFetch mounting");
    isMounted.current = true;
    fetchInProgress.current = false;
    
    if (!initialFetchAttempted.current) {
      retryCount.current = 0;
      initialFetchAttempted.current = false;
      
      initialFetchDelayRef.current = setTimeout(() => {
        if (isMounted.current) {
          console.log("Starting initial data fetch");
          fetchData();
        }
      }, 1500);
    }
    
    return () => {
      console.log("useUserFetch unmounting");
      isMounted.current = false;
      if (initialFetchDelayRef.current) {
        clearTimeout(initialFetchDelayRef.current);
      }
    };
  }, [fetchData]);

  const refetchUserData = useCallback(async () => {
    if (!isMounted.current || fetchInProgress.current) {
      return false;
    }
    
    console.log("Manual refetch requested");
    
    const isAuthValid = await verifyAuth();
    
    if (isAuthValid) {
      await fetchData();
      return true;
    } else {
      toast({
        title: "Problème d'authentification",
        description: "Impossible de rafraîchir vos données. Veuillez vous reconnecter.",
        variant: "destructive"
      });
      return false;
    }
  }, [fetchData]);

  const correctedUserData = ensureZeroBalanceForNewUser(isNewUser, fetchedUserData);

  return {
    userData: correctedUserData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading: isLoading || !initialFetchAttempted.current,
    setShowLimitAlert,
    refetchUserData
  };
};
