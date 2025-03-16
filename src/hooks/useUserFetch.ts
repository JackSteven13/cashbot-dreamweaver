
import { useEffect, useRef, useState, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher } from './useUserDataFetcher';
import { toast } from "@/components/ui/use-toast";

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
  const maxRetries = 3;
  
  // Initialisation de l'état avec des valeurs par défaut
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  // Fonction de récupération de données sécurisée et stabilisée
  const fetchData = useCallback(async () => {
    if (fetchInProgress.current || !isMounted.current) return;
    
    try {
      fetchInProgress.current = true;
      await fetchUserData();
      // Reset retry count on success
      if (retryCount > 0) setRetryCount(0);
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      // Implement retry logic
      if (retryCount < maxRetries && isMounted.current) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying fetch (${nextRetry}/${maxRetries}) in ${backoffTime}ms`);
        
        setTimeout(() => {
          if (isMounted.current) fetchData();
        }, backoffTime);
      } else if (isMounted.current) {
        // Only show error after all retries fail
        toast({
          title: "Erreur de connexion",
          description: "Impossible de charger vos données. Veuillez vérifier votre connexion.",
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
    // Réinitialiser l'état de montage et lancer la récupération initiale
    isMounted.current = true;
    fetchInProgress.current = false;
    
    // Récupération initiale des données
    if (!isLoading) {
      fetchData().catch(console.error);
    }
    
    // Nettoyage pour éviter les fuites mémoire et les mises à jour d'état sur des composants démontés
    return () => {
      isMounted.current = false;
    };
  }, [fetchData, isLoading]);

  // Fonction refetch stable et sécurisée
  const refetchUserData = useCallback(async () => {
    if (isMounted.current && !fetchInProgress.current) {
      await fetchData();
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
