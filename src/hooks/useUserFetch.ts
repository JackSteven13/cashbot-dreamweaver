
import { useEffect, useRef, useState, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher } from './useUserDataFetcher';
import { toast } from "@/components/ui/use-toast";
import { verifyAuth } from "@/utils/auth/verificationUtils";
import { refreshSession } from "@/utils/auth/sessionUtils";

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
  const maxRetries = 5;
  const initialFetchDelayRef = useRef<NodeJS.Timeout | null>(null);
  const initialFetchAttempted = useRef(false);
  const lastFetchTimestamp = useRef(0);
  
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  const fetchData = useCallback(async () => {
    // Prevent multiple fetches within a short timeframe (debounce)
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
      
      // Ajout d'un délai court pour éviter les conflits de requêtes
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Vérification de l'authentification
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
        
        // Attendre un peu après le rafraîchissement
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
        // Notification visuelle en cas d'échecs répétés
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
    
    // Only reset these on initial mount, not on re-renders
    if (!initialFetchAttempted.current) {
      retryCount.current = 0;
      initialFetchAttempted.current = false;
      
      // Delay initial fetch to avoid race conditions
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
      return;
    }
    
    console.log("Manual refetch requested");
    
    // Vérification de l'état d'authentification avant la récupération
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
    isLoading: isLoading || !initialFetchAttempted.current,
    setShowLimitAlert,
    refetchUserData
  };
};
