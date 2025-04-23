
import { useEffect } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher } from '../useUserDataFetcher';
import { useFetchData } from './useFetchData';
import { ensureZeroBalanceForNewUser } from '@/utils/userDataInitializer';
import { cleanOtherUserData } from '@/utils/balance/balanceStorage';

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

/**
 * Refactored hook that fetches user data with improved structure
 */
export const useUserFetchRefactored = (): UserFetchResult => {
  const [fetcherState, fetcherActions] = useUserDataFetcher();
  
  const { userData: fetchedUserData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = fetcherState;
  const { setShowLimitAlert, fetchUserData } = fetcherActions;
  
  const {
    fetchData,
    refetchUserData,
    isMounted,
    initialFetchAttempted,
    initialFetchDelayRef
  } = useFetchData(fetchUserData);

  // Effect for mounting and initial data fetch
  useEffect(() => {
    console.log("useUserFetch mounting, isNewUser:", isNewUser);
    isMounted.current = true;
    
    if (!initialFetchAttempted.current) {
      initialFetchAttempted.current = true;
      
      // Nettoyer toutes les données statistiques préexistantes au chargement initial pour les nouveaux utilisateurs
      if (isNewUser) {
        console.log("Nettoyage complet des données localStorage pour nouvel utilisateur");
        try {
          // Supprimer TOUTES les clés qui pourraient contenir des données d'autres utilisateurs
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
              key.startsWith('user_stats_') || 
              key.startsWith('currentBalance_') || 
              key.startsWith('lastKnownBalance_') ||
              key.startsWith('lastUpdatedBalance_') ||
              key.startsWith('highest_balance_') ||
              key === 'currentBalance' ||
              key === 'lastKnownBalance' ||
              key === 'lastUpdatedBalance'
            )) {
              localStorage.removeItem(key);
            }
          }
          
          // Nettoyer également les données de sessionStorage
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('currentBalance_') || key === 'currentBalance') {
              sessionStorage.removeItem(key);
            }
          });
          
        } catch (e) {
          console.error('Error cleaning localStorage during initial mount:', e);
        }
      }
      
      // Use longer delay to avoid initialization conflicts
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
  }, [fetchData, isNewUser]);

  // Si nous avons un utilisateur avec un ID, nettoyer les données des autres utilisateurs
  useEffect(() => {
    if (fetchedUserData?.profile?.id && !isLoading) {
      const userId = fetchedUserData.profile.id;
      console.log("Nettoyage des données pour isoler utilisateur:", userId);
      cleanOtherUserData(userId);
    }
  }, [fetchedUserData?.profile?.id, isLoading]);

  // Apply the rule for new users (zero balance)
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
