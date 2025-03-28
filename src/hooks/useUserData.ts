
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserFetch } from './useUserFetch';
import { useBalanceActions } from './useBalanceActions';
import { ensureZeroBalanceForNewUser } from '@/utils/userDataInitializer';

export type { UserData };

export const useUserData = () => {
  // Get user data and loading state from the fetch hook
  const { 
    userData: fetchedUserData, 
    isNewUser,
    dailySessionCount: fetchedDailySessionCount, 
    showLimitAlert: initialShowLimitAlert,
    isLoading,
    setShowLimitAlert: setFetchedShowLimitAlert,
    refetchUserData
  } = useUserFetch();

  // Make sure new users have zero balance and no limit alert
  const sanitizedUserData = ensureZeroBalanceForNewUser(isNewUser, fetchedUserData);

  // Create state variables to be managed by balance actions
  const [userData, setUserData] = useState<UserData>(sanitizedUserData);
  const [dailySessionCount, setDailySessionCount] = useState<number>(fetchedDailySessionCount);
  const [showLimitAlert, setShowLimitAlert] = useState<boolean>(isNewUser ? false : initialShowLimitAlert);

  // Update local state when fetched data changes
  useEffect(() => {
    if (fetchedUserData && JSON.stringify(fetchedUserData) !== JSON.stringify(userData)) {
      // Ensure new users start with zero balance
      const dataToUse = isNewUser 
        ? { ...fetchedUserData, balance: 0, transactions: [] }
        : fetchedUserData;
        
      console.log("Updating userData from fetchedUserData:", dataToUse);
      setUserData(dataToUse);
    }
  }, [fetchedUserData, userData, isNewUser]);

  useEffect(() => {
    if (fetchedDailySessionCount !== dailySessionCount) {
      console.log("Updating dailySessionCount from", dailySessionCount, "to", fetchedDailySessionCount);
      setDailySessionCount(fetchedDailySessionCount);
    }
  }, [fetchedDailySessionCount, dailySessionCount]);

  useEffect(() => {
    // Ne pas montrer l'alerte de limite pour les nouveaux utilisateurs
    if (initialShowLimitAlert !== showLimitAlert && !isNewUser) {
      console.log("Updating showLimitAlert from", showLimitAlert, "to", initialShowLimitAlert);
      setShowLimitAlert(initialShowLimitAlert);
    }
  }, [initialShowLimitAlert, showLimitAlert, isNewUser]);
  
  // Get balance and session action handlers
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

  // Memoize setShowLimitAlert to prevent infinite re-renders
  const handleSetShowLimitAlert = useCallback((show: boolean) => {
    // Ne pas montrer l'alerte de limite pour les nouveaux utilisateurs
    if (!isNewUser) {
      console.log("Setting showLimitAlert to", show);
      setShowLimitAlert(show);
      setFetchedShowLimitAlert(show);
    }
  }, [setFetchedShowLimitAlert, isNewUser]);

  // Add a function to refresh the user data from the backend
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
