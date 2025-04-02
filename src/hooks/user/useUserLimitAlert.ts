
import { useCallback } from 'react';

export const useUserLimitAlert = (
  isNewUser: boolean,
  setShowLimitAlert: React.Dispatch<React.SetStateAction<boolean>>,
  setFetchedShowLimitAlert: (show: boolean) => void,
  previousLimitAlertRef: React.MutableRefObject<boolean | null>
) => {
  // Handle setting the show limit alert state
  const handleSetShowLimitAlert = useCallback((show: boolean) => {
    // Don't show the limit alert for new users
    if (!isNewUser) {
      console.log("Setting showLimitAlert to", show);
      setShowLimitAlert(show);
      setFetchedShowLimitAlert(show);
      previousLimitAlertRef.current = show;
    }
  }, [setFetchedShowLimitAlert, isNewUser, setShowLimitAlert, previousLimitAlertRef]);

  return {
    handleSetShowLimitAlert
  };
};
