
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserFetch } from './useUserFetch';
import { useBalanceActions } from './useBalanceActions';

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
    refetchUserData // Make sure this exists in useUserFetch
  } = useUserFetch();

  // Create state variables to be managed by balance actions
  const [userData, setUserData] = useState<UserData>(fetchedUserData);
  const [dailySessionCount, setDailySessionCount] = useState<number>(fetchedDailySessionCount);
  const [showLimitAlert, setShowLimitAlert] = useState<boolean>(initialShowLimitAlert);

  // Update local state when fetched data changes
  useEffect(() => {
    if (fetchedUserData && JSON.stringify(fetchedUserData) !== JSON.stringify(userData)) {
      console.log("Updating userData from fetchedUserData:", fetchedUserData);
      setUserData(fetchedUserData);
    }
  }, [fetchedUserData, userData]);

  useEffect(() => {
    if (fetchedDailySessionCount !== dailySessionCount) {
      console.log("Updating dailySessionCount from", dailySessionCount, "to", fetchedDailySessionCount);
      setDailySessionCount(fetchedDailySessionCount);
    }
  }, [fetchedDailySessionCount, dailySessionCount]);

  useEffect(() => {
    if (initialShowLimitAlert !== showLimitAlert) {
      console.log("Updating showLimitAlert from", showLimitAlert, "to", initialShowLimitAlert);
      setShowLimitAlert(initialShowLimitAlert);
    }
  }, [initialShowLimitAlert, showLimitAlert]);
  
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
    console.log("Setting showLimitAlert to", show);
    setShowLimitAlert(show);
    setFetchedShowLimitAlert(show);
  }, [setFetchedShowLimitAlert]);

  // Add a function to refresh the user data from the backend
  const refreshUserData = useCallback(async () => {
    if (refetchUserData) {
      await refetchUserData();
    }
  }, [refetchUserData]);

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert: handleSetShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading,
    refreshUserData
  };
};
