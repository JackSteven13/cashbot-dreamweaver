
import { useCallback } from 'react';

export const useUserDataRefresher = (refetchUserData: (() => Promise<boolean>) | undefined) => {
  // Function to refresh user data
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    if (refetchUserData) {
      try {
        return await refetchUserData();
      } catch (error) {
        console.error("Error in refreshUserData:", error);
        return false;
      }
    }
    return false;
  }, [refetchUserData]);

  return {
    refreshUserData
  };
};
