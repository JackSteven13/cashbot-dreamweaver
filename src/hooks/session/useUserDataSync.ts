
import { useCallback } from 'react';
import { useUserDataRefresh } from './useUserDataRefresh';

export const useUserDataSync = () => {
  const { refreshUserData } = useUserDataRefresh();
  
  // Function to sync user data
  const syncUserData = useCallback(async (mountedRef: React.RefObject<boolean>) => {
    try {
      if (!mountedRef.current) return false;
      
      console.log("Syncing user data in background");
      const result = await refreshUserData();
      return result;
    } catch (error) {
      console.error("Error syncing user data:", error);
      return false;
    }
  }, [refreshUserData]);

  return { syncUserData };
};
