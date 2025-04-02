
import { UserData } from '@/types/userData';
import { useUserFetch } from './useUserFetch';
import { useBalanceActions } from './useBalanceActions';
import { ensureZeroBalanceForNewUser } from '@/utils/userDataInitializer';
import { useUserDataState } from './user/useUserDataState';
import { useUserDataSynchronization } from './user/useUserDataSynchronization';
import { useUserLimitAlert } from './user/useUserLimitAlert';
import { useUserDataRefresher } from './user/useUserDataRefresher';
import { useMemo } from 'react';

export type { UserData };

// Create a default UserData object to prevent undefined errors
const defaultUserData: UserData = {
  username: '',
  balance: 0,
  subscription: 'freemium',
  transactions: [],
  referrals: [],
  referralLink: '',
};

export const useUserData = () => {
  // Get data and loading state from the fetch hook
  const { 
    userData: fetchedUserData, 
    isNewUser,
    dailySessionCount: fetchedDailySessionCount, 
    showLimitAlert: initialShowLimitAlert,
    isLoading,
    setShowLimitAlert: setFetchedShowLimitAlert,
    refetchUserData
  } = useUserFetch();

  // Ensure we always have valid data by providing defaults when needed
  const safeUserData = useMemo(() => {
    return fetchedUserData || defaultUserData;
  }, [fetchedUserData]);

  // Ensure new users have zero balance
  const sanitizedUserData = ensureZeroBalanceForNewUser(isNewUser, safeUserData);
  
  // Use the user data state hook to manage local state
  const {
    userData,
    dailySessionCount,
    showLimitAlert,
    isNewUser: localIsNewUser,
    setUserData,
    setDailySessionCount,
    setShowLimitAlert,
    setIsNewUser,
    previousUserDataRef,
    previousSessionCountRef,
    previousLimitAlertRef
  } = useUserDataState(sanitizedUserData);

  // Synchronize state with fetched data
  useUserDataSynchronization(
    sanitizedUserData,
    isNewUser,
    fetchedDailySessionCount,
    initialShowLimitAlert,
    setUserData,
    setDailySessionCount,
    setShowLimitAlert,
    setIsNewUser,
    previousUserDataRef,
    previousSessionCountRef,
    previousLimitAlertRef
  );

  // Handle limit alert state
  const { handleSetShowLimitAlert } = useUserLimitAlert(
    isNewUser,
    setShowLimitAlert,
    setFetchedShowLimitAlert,
    previousLimitAlertRef
  );

  // Get handlers for balance and session actions
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

  // Handle refreshing user data
  const { refreshUserData } = useUserDataRefresher(refetchUserData);

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert: isNewUser ? false : showLimitAlert, // Always false for new users
    setShowLimitAlert: handleSetShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading,
    refreshUserData
  };
};
