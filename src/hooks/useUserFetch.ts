
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher, UserFetcherState } from './useUserDataFetcher';
import { toast } from "@/components/ui/use-toast";
// Utiliser les importations spécifiques pour éviter les conflits
import { verifyAuth } from "@/utils/auth";
import { refreshSession } from "@/utils/auth";
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
  const maxRetries = 3; // Réduire le nombre de tentatives pour éviter les boucles
  const initialFetchDelayRef = useRef<NodeJS.Timeout | null>(null);
  const initialFetchAttempted = useRef(false);
  const lastFetchTimestamp = useRef(0);
  const fetchQueueRef = useRef<number>(0); // Pour suivre les appels en attente
  const lastRefreshTimestamp = useRef(0); // Pour éviter les rafraîchissements trop fréquents
  
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData: fetchedUserData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  const fetchData = useCallback(async () => {
    // Protection contre les appels trop fréquents (augmenté à 3s)
    const now = Date.now();
    if (now - lastFetchTimestamp.current < 3000) {
      console.log("Skipping fetch - too soon after last fetch");
      return;
    }
    
    // Protection encore plus stricte contre les appels multiples simultanés
    if (fetchInProgress.current || !isMounted.current) {
      console.log("Fetch already in progress or component unmounted, skipping");
      return;
    }
    
    try {
      // Incrémenter le compteur de la file d'attente
      fetchQueueRef.current++;
      const currentQueueId = fetchQueueRef.current;
      
      fetchInProgress.current = true;
      lastFetchTimestamp.current = now;
      
      // Délai pour éviter les problèmes de course
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Vérifier si le composant est toujours monté et si cette requête est la plus récente
      if (!isMounted.current || currentQueueId !== fetchQueueRef.current) {
        console.log("Component unmounted or newer fetch request exists, aborting");
        fetchInProgress.current = false;
        return;
      }
      
      // Vérification de l'authentification avec protection contre les rafraîchissements excessifs
      const shouldRefresh = now - lastRefreshTimestamp.current > 30000; // 30 secondes entre les refreshes
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
        
        // Délai après rafraîchissement
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Vérifier à nouveau l'authentification après le rafraîchissement
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
      await fetchUserData();
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

  // Effet de montage avec protection améliorée
  useEffect(() => {
    console.log("useUserFetch mounting");
    isMounted.current = true;
    fetchInProgress.current = false;
    fetchQueueRef.current = 0; // Réinitialiser la file d'attente
    
    if (!initialFetchAttempted.current) {
      retryCount.current = 0;
      initialFetchAttempted.current = false;
      
      // Utiliser un délai plus long pour éviter les conflits d'initialisation
      initialFetchDelayRef.current = setTimeout(() => {
        if (isMounted.current) {
          console.log("Starting initial data fetch");
          fetchData();
        }
      }, 2000);
    }
    
    return () => {
      console.log("useUserFetch unmounting");
      isMounted.current = false;
      if (initialFetchDelayRef.current) {
        clearTimeout(initialFetchDelayRef.current);
      }
    };
  }, [fetchData]);

  // Fonction pour forcer la récupération des données avec protection améliorée
  const refetchUserData = useCallback(async () => {
    // Empêcher les rechargements trop fréquents
    const now = Date.now();
    if (now - lastFetchTimestamp.current < 5000) {
      console.log("Manual refetch rejected - too soon after last fetch");
      return false;
    }
    
    if (!isMounted.current || fetchInProgress.current) {
      return false;
    }
    
    console.log("Manual refetch requested");
    
    try {
      const isAuthValid = await verifyAuth();
      
      if (isAuthValid) {
        await fetchData();
        return true;
      } else {
        // Tenter un rafraîchissement avant d'abandonner
        if (now - lastRefreshTimestamp.current > 30000) {
          lastRefreshTimestamp.current = now;
          const refreshed = await refreshSession();
          
          if (refreshed) {
            // Délai après rafraîchissement
            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchData();
            return true;
          }
        }
        
        toast({
          title: "Problème d'authentification",
          description: "Impossible de rafraîchir vos données. Veuillez vous reconnecter.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error during manual refetch:", error);
      return false;
    }
  }, [fetchData]);

  // Appliquer la règle des nouveaux utilisateurs (solde zéro)
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
