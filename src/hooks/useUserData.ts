
import { useState, useEffect } from 'react';
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
    setShowLimitAlert: setFetchedShowLimitAlert
  } = useUserFetch();

  // Create state variables to be managed by balance actions
  const [userData, setUserData] = useState<UserData>(fetchedUserData);
  const [dailySessionCount, setDailySessionCount] = useState<number>(fetchedDailySessionCount);
  const [showLimitAlert, setShowLimitAlert] = useState<boolean>(initialShowLimitAlert);

  // Update local state when fetched data changes
  useEffect(() => {
    if (fetchedUserData && fetchedUserData !== userData) {
      setUserData(fetchedUserData);
    }
  }, [fetchedUserData, userData]);

  useEffect(() => {
    if (fetchedDailySessionCount !== dailySessionCount) {
      setDailySessionCount(fetchedDailySessionCount);
    }
  }, [fetchedDailySessionCount, dailySessionCount]);

  useEffect(() => {
    if (initialShowLimitAlert !== showLimitAlert) {
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

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert: (show: boolean) => {
      setShowLimitAlert(show);
      setFetchedShowLimitAlert(show);
    },
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading
  };
};
