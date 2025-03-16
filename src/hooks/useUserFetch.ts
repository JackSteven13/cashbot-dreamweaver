
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
  // Stabilité des références pour éviter les problèmes de montage/démontage
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3; // Réduit pour accélérer les tentatives
  const retryDelay = useRef(800); // Réduit pour des reprises plus rapides
  
  // Initialisation de l'état avec des valeurs par défaut
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  // Fonction de récupération de données sécurisée et stabilisée
  const fetchData = useCallback(async () => {
    if (fetchInProgress.current || !isMounted.current) {
      console.log("Fetch skipped: already in progress or component unmounted");
      return;
    }
    
    try {
      console.log("Starting fetchData in useUserFetch");
      fetchInProgress.current = true;
      
      // Vérifier l'authentification avant de charger les données
      const isAuthValid = await verifyAndRepairAuth();
      
      if (!isAuthValid) {
        console.error("Invalid authentication state, cannot fetch user data");
        fetchInProgress.current = false;
        return;
      }
      
      await fetchUserData();
      console.log("fetchUserData completed successfully");
      
      // Reset retry count on success
      if (retryCount > 0) setRetryCount(0);
      retryDelay.current = 800; // Reset delay on success
      fetchInProgress.current = false;
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      // Implement improved retry logic with simpler backoff
      if (retryCount < maxRetries && isMounted.current) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        // Linear backoff: 800ms, 1600ms, 2400ms
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
        // Only show error after all retries fail
        fetchInProgress.current = false;
        
        // Ne pas montrer de toast ici, cela pourrait être confus
        console.log("All retries failed or component unmounted");
      }
    }
  }, [fetchUserData, retryCount, maxRetries]);

  // Effet pour gérer le cycle de vie
  useEffect(() => {
    // Réinitialiser l'état de montage
    isMounted.current = true;
    fetchInProgress.current = false;
    
    console.log("useEffect in useUserFetch triggered, isLoading:", isLoading);
    
    // Vérifier l'authentification avant d'essayer de charger les données
    verifyAndRepairAuth().then(isAuthValid => {
      if (!isAuthValid) {
        console.log("Auth verification failed, skipping data fetch");
        return;
      }
      
      if (!isMounted.current) {
        console.log("Component unmounted after auth verification, skipping fetch");
        return;
      }
      
      // Délai court pour éviter les conflits avec d'autres initialisations
      setTimeout(() => {
        if (isMounted.current && !fetchInProgress.current) {
          fetchData().catch(e => console.error("Initial fetch failed:", e));
        }
      }, 300);
    }).catch(error => {
      console.error("Auth verification error:", error);
    });
    
    // Nettoyage
    return () => {
      console.log("useUserFetch component unmounting");
      isMounted.current = false;
    };
  }, [fetchData]);

  // Fonction refetch stable et sécurisée
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
    // Vérifier l'authentification avant de recharger
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
