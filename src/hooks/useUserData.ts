
import { UserData } from '@/types/userData';
import { useUserFetch } from './useUserFetch';
import { useBalanceActions } from './useBalanceActions';
import { ensureZeroBalanceForNewUser } from '@/utils/userDataInitializer';
import { useUserDataState } from './user/useUserDataState';
import { useUserDataSynchronization } from './user/useUserDataSynchronization';
import { useUserLimitAlert } from './user/useUserLimitAlert';
import { useUserDataRefresher } from './user/useUserDataRefresher';

export type { UserData };

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

  // Ensure new users have zero balance
  const sanitizedUserData = ensureZeroBalanceForNewUser(isNewUser, fetchedUserData);
  
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
    fetchedUserData,
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
