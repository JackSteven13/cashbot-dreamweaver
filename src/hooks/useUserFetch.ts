
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
  const maxRetries = 2;
  const retryDelay = useRef(800);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStabilityChecked = useRef(false);
  
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  // Optimized data fetching function with better error handling
  const fetchData = useCallback(async () => {
    if (fetchInProgress.current || !isMounted.current) {
      console.log("Fetch skipped: already in progress or component unmounted");
      return;
    }
    
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    try {
      console.log("Starting fetchData in useUserFetch");
      fetchInProgress.current = true;
      
      // Vérifier si la session est stable
      if (!sessionStabilityChecked.current) {
        console.log("Vérification de la stabilité de la session...");
        const isAuthValid = await verifyAndRepairAuth();
        
        if (!isAuthValid) {
          console.error("Invalid authentication state, cannot fetch user data");
          fetchInProgress.current = false;
          
          // Ne pas réessayer immédiatement mais attendre
          fetchTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              fetchInProgress.current = false;
              fetchData();
            }
          }, 2000);
          return;
        }
        
        sessionStabilityChecked.current = true;
      }
      
      // Ajouter un délai pour éviter les appels trop rapides
      await new Promise(resolve => setTimeout(resolve, 200));
      
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
        
        fetchTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            console.log(`Executing retry ${nextRetry}/${maxRetries}`);
            fetchInProgress.current = false;
            sessionStabilityChecked.current = false; // Réinitialiser pour vérifier à nouveau la session
            fetchData().catch(e => console.error("Retry failed:", e));
          }
        }, backoffTime);
      } else {
        fetchInProgress.current = false;
        console.log("All retries failed or component unmounted");
        
        // Après les tentatives maximales, attendre plus longtemps avant de réessayer
        fetchTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            console.log("Final attempt after cooldown");
            fetchInProgress.current = false;
            sessionStabilityChecked.current = false;
            setRetryCount(0);
            fetchData().catch(e => console.error("Final attempt failed:", e));
          }
        }, 5000);
      }
    }
  }, [fetchUserData, retryCount, maxRetries]);

  // Simplified component lifecycle with better cleanup
  useEffect(() => {
    isMounted.current = true;
    fetchInProgress.current = false;
    sessionStabilityChecked.current = false;
    
    // Utiliser un délai progressif pour les tentatives initiales
    const initialDelays = [300, 1000, 2000];
    let currentAttempt = 0;
    
    const scheduleInitialFetch = () => {
      if (!isMounted.current) return;
      
      const delay = initialDelays[currentAttempt] || 3000;
      console.log(`Scheduling initial fetch attempt ${currentAttempt + 1} in ${delay}ms`);
      
      fetchTimeoutRef.current = setTimeout(async () => {
        if (!isMounted.current) return;
        
        try {
          const isAuthValid = await verifyAndRepairAuth();
          
          if (!isAuthValid) {
            currentAttempt++;
            if (currentAttempt < initialDelays.length + 2) {
              scheduleInitialFetch();
            }
            return;
          }
          
          if (!fetchInProgress.current) {
            fetchData().catch(e => {
              console.error("Initial fetch failed:", e);
              currentAttempt++;
              if (currentAttempt < initialDelays.length + 2) {
                scheduleInitialFetch();
              }
            });
          }
        } catch (e) {
          console.error("Auth check error:", e);
          currentAttempt++;
          if (currentAttempt < initialDelays.length + 2) {
            scheduleInitialFetch();
          }
        }
      }, delay);
    };
    
    // Démarrer la séquence de tentatives
    scheduleInitialFetch();
    
    return () => {
      console.log("useUserFetch component unmounting");
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
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
    sessionStabilityChecked.current = false;
    
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
