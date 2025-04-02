
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { useUserFetch } from './useUserFetch';
import { useBalanceActions } from './useBalanceActions';
import { ensureZeroBalanceForNewUser } from '@/utils/userDataInitializer';

export type { UserData };

export const useUserData = () => {
  // Utiliser une référence pour suivre les modifications
  const previousUserDataRef = useRef<string>('');
  const previousSessionCountRef = useRef<number>(-1);
  const previousLimitAlertRef = useRef<boolean | null>(null);

  // Obtenir les données et l'état de chargement depuis le hook de récupération
  const { 
    userData: fetchedUserData, 
    isNewUser,
    dailySessionCount: fetchedDailySessionCount, 
    showLimitAlert: initialShowLimitAlert,
    isLoading,
    setShowLimitAlert: setFetchedShowLimitAlert,
    refetchUserData
  } = useUserFetch();

  // S'assurer que les nouveaux utilisateurs ont un solde nul
  const sanitizedUserData = ensureZeroBalanceForNewUser(isNewUser, fetchedUserData);
  
  // Créer des variables d'état locales à gérer par les actions de solde
  const [userData, setUserData] = useState<UserData>(sanitizedUserData);
  const [dailySessionCount, setDailySessionCount] = useState<number>(fetchedDailySessionCount);
  const [showLimitAlert, setShowLimitAlert] = useState<boolean>(isNewUser ? false : initialShowLimitAlert);

  // Mettre à jour l'état local quand les données récupérées changent - avec protection contre les boucles
  useEffect(() => {
    const currentUserDataJSON = JSON.stringify(fetchedUserData);
    
    if (fetchedUserData && currentUserDataJSON !== previousUserDataRef.current) {
      // S'assurer que les nouveaux utilisateurs commencent avec un solde nul
      const dataToUse = isNewUser 
        ? { ...fetchedUserData, balance: 0, transactions: [] }
        : fetchedUserData;
      
      console.log("Updating userData from fetchedUserData:", dataToUse);
      setUserData(dataToUse);
      previousUserDataRef.current = currentUserDataJSON;
    }
  }, [fetchedUserData, isNewUser]);

  // Mettre à jour le compteur de sessions lorsque les données récupérées changent - avec protection
  useEffect(() => {
    if (fetchedDailySessionCount !== previousSessionCountRef.current) {
      console.log("Updating dailySessionCount from", dailySessionCount, "to", fetchedDailySessionCount);
      setDailySessionCount(fetchedDailySessionCount);
      previousSessionCountRef.current = fetchedDailySessionCount;
    }
  }, [fetchedDailySessionCount, dailySessionCount]);

  // Mettre à jour l'état d'alerte de limite lorsque les données récupérées changent - avec protection
  useEffect(() => {
    // Ne pas montrer l'alerte de limite pour les nouveaux utilisateurs
    if (initialShowLimitAlert !== previousLimitAlertRef.current && !isNewUser) {
      console.log("Updating showLimitAlert from", showLimitAlert, "to", initialShowLimitAlert);
      setShowLimitAlert(initialShowLimitAlert);
      previousLimitAlertRef.current = initialShowLimitAlert;
    }
  }, [initialShowLimitAlert, showLimitAlert, isNewUser]);
  
  // Obtenir les gestionnaires d'actions de solde et de session
  const { 
    incrementSessionCount,
    updateBalance,
    resetBalance
  } = useBalanceActions({
    userData,
    dailySessionCount,
    setUserData,
    setDailySessionCount,
    setShowLimitAlert
  });

  // Mémoriser setShowLimitAlert pour éviter les re-rendus infinis
  const handleSetShowLimitAlert = useCallback((show: boolean) => {
    // Ne pas montrer l'alerte de limite pour les nouveaux utilisateurs
    if (!isNewUser) {
      console.log("Setting showLimitAlert to", show);
      setShowLimitAlert(show);
      setFetchedShowLimitAlert(show);
      previousLimitAlertRef.current = show;
    }
  }, [setFetchedShowLimitAlert, isNewUser]);

  // Ajouter une fonction pour rafraîchir les données utilisateur depuis le backend
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    if (refetchUserData) {
      try {
        await refetchUserData();
        return true;
      } catch (error) {
        console.error("Error in refreshUserData:", error);
        return false;
      }
    }
    return false;
  }, [refetchUserData]);

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert: isNewUser ? false : showLimitAlert, // Toujours false pour les nouveaux utilisateurs
    setShowLimitAlert: handleSetShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading,
    refreshUserData
  };
};
