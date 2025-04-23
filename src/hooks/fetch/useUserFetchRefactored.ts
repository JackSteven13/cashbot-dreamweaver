
import { useEffect } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetcher } from '../useUserDataFetcher';
import { useFetchData } from './useFetchData';
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
    console.log("useUserFetch mounting");
    isMounted.current = true;
    
    if (!initialFetchAttempted.current) {
      initialFetchAttempted.current = false;
      
      // Nettoyer toutes les données statistiques préexistantes au chargement initial pour les nouveaux utilisateurs
      if (isNewUser) {
        try {
          // Nettoyer spécifiquement les statistiques et les soldes
          const keysToClean = Object.keys(localStorage).filter(key => 
            key.startsWith('user_stats_') || 
            key.startsWith('currentBalance_') || 
            key.startsWith('lastKnownBalance_')
          );
          
          for (const key of keysToClean) {
            localStorage.removeItem(key);
          }
          
          // Réinitialiser les clés génériques aussi
          localStorage.removeItem('currentBalance');
          localStorage.removeItem('lastKnownBalance');
          localStorage.removeItem('lastUpdatedBalance');
          sessionStorage.removeItem('currentBalance');
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
