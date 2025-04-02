
import { useEffect } from 'react';
import { UserData } from '@/types/userData';
import { ensureZeroBalanceForNewUser } from '@/utils/userDataInitializer';

export const useUserDataSynchronization = (
  fetchedUserData: UserData,
  isNewUser: boolean,
  fetchedDailySessionCount: number,
  initialShowLimitAlert: boolean,
  setUserData: React.Dispatch<React.SetStateAction<UserData>>,
  setDailySessionCount: React.Dispatch<React.SetStateAction<number>>,
  setShowLimitAlert: React.Dispatch<React.SetStateAction<boolean>>,
  setIsNewUser: React.Dispatch<React.SetStateAction<boolean>>,
  previousUserDataRef: React.MutableRefObject<string>,
  previousSessionCountRef: React.MutableRefObject<number>,
  previousLimitAlertRef: React.MutableRefObject<boolean | null>
) => {
  // Update the local state when fetched data changes
  useEffect(() => {
    setIsNewUser(isNewUser);
  }, [isNewUser, setIsNewUser]);

  // Update user data when fetchedUserData changes
  useEffect(() => {
    const currentUserDataJSON = JSON.stringify(fetchedUserData);
    
    if (fetchedUserData && currentUserDataJSON !== previousUserDataRef.current) {
      // Ensure new users start with zero balance
      const dataToUse = isNewUser 
        ? { ...fetchedUserData, balance: 0, transactions: [] }
        : fetchedUserData;
      
      console.log("Updating userData from fetchedUserData:", dataToUse);
      setUserData(dataToUse);
      previousUserDataRef.current = currentUserDataJSON;
    }
  }, [fetchedUserData, isNewUser, setUserData, previousUserDataRef]);

  // Update session count when fetchedDailySessionCount changes
  useEffect(() => {
    if (fetchedDailySessionCount !== previousSessionCountRef.current) {
      console.log("Updating dailySessionCount from", previousSessionCountRef.current, "to", fetchedDailySessionCount);
      setDailySessionCount(fetchedDailySessionCount);
      previousSessionCountRef.current = fetchedDailySessionCount;
    }
  }, [fetchedDailySessionCount, setDailySessionCount, previousSessionCountRef]);

  // Update limit alert when initialShowLimitAlert changes
  useEffect(() => {
    // Don't show limit alert for new users
    if (initialShowLimitAlert !== previousLimitAlertRef.current && !isNewUser) {
      console.log("Updating showLimitAlert from", previousLimitAlertRef.current, "to", initialShowLimitAlert);
      setShowLimitAlert(initialShowLimitAlert);
      previousLimitAlertRef.current = initialShowLimitAlert;
    }
  }, [initialShowLimitAlert, isNewUser, setShowLimitAlert, previousLimitAlertRef]);
};
