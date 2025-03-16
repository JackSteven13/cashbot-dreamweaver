
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
  const maxRetries = 5; // Maintenu pour la résilience
  const retryDelay = useRef(1000);
  
  // Initialisation de l'état avec des valeurs par défaut
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  // Fonction de récupération de données sécurisée et stabilisée
  const fetchData = useCallback(async () => {
    if (fetchInProgress.current || !isMounted.current) return;
    
    try {
      console.log("Starting fetchData in useUserFetch");
      fetchInProgress.current = true;
      
      // Vérifier et réparer l'authentification avant de charger les données
      const isAuthValid = await verifyAndRepairAuth();
      
      if (!isAuthValid) {
        console.error("Invalid authentication state, cannot fetch user data");
        throw new Error("Authentication invalid");
      }
      
      await fetchUserData();
      console.log("fetchUserData completed successfully");
      
      // Reset retry count on success
      if (retryCount > 0) setRetryCount(0);
      retryDelay.current = 1000; // Reset delay on success
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      // Implement improved retry logic with exponential backoff
      if (retryCount < maxRetries && isMounted.current) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        // Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s + random jitter
        const jitter = Math.random() * 500;
        const backoffTime = Math.min(30000, Math.pow(2, retryCount) * retryDelay.current + jitter);
        retryDelay.current = backoffTime;
        
        console.log(`Retrying fetch (${nextRetry}/${maxRetries}) in ${backoffTime}ms`);
        
        setTimeout(() => {
          if (isMounted.current && !fetchInProgress.current) {
            console.log(`Executing retry ${nextRetry}/${maxRetries}`);
            fetchData().catch(e => console.error("Retry failed:", e));
          }
        }, backoffTime);
      } else if (isMounted.current) {
        // Only show error after all retries fail and we're still mounted
        fetchInProgress.current = false;
        
        toast({
          title: "Problème de chargement",
          description: "Impossible de charger vos données. Essayez de rafraîchir la page.",
          variant: "destructive"
        });
      }
    } finally {
      // Don't release lock if retrying, otherwise release it
      if (retryCount >= maxRetries || retryCount === 0) {
        fetchInProgress.current = false;
      }
    }
  }, [fetchUserData, retryCount, maxRetries]);

  // Effet pour gérer le cycle de vie et éviter les mises à jour d'état sur un composant démonté
  useEffect(() => {
    // Réinitialiser l'état de montage
    isMounted.current = true;
    fetchInProgress.current = false;
    
    console.log("useEffect in useUserFetch triggered, isLoading:", isLoading);
    
    // Délai court avant la première tentative pour permettre au système de s'initialiser
    setTimeout(async () => {
      if (!isMounted.current) return;
      
      // Vérifier si l'utilisateur est authentifié avant de charger les données
      const isAuthValid = await verifyAndRepairAuth();
      
      if (isAuthValid && isMounted.current) {
        console.log("Authentication valid, proceeding with data fetch");
        
        // Introduire un léger délai pour éviter les courses
        setTimeout(() => {
          if (isMounted.current) {
            fetchData().catch(console.error);
          }
        }, 300);
      } else if (isMounted.current) {
        console.log("Authentication invalid, will not fetch user data");
      }
    }, 100);
    
    // Nettoyage pour éviter les fuites mémoire et les mises à jour d'état sur des composants démontés
    return () => {
      console.log("useUserFetch component unmounting");
      isMounted.current = false;
    };
  }, [fetchData]);

  // Fonction refetch stable et sécurisée
  const refetchUserData = useCallback(async () => {
    if (isMounted.current && !fetchInProgress.current) {
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
