
import { useCallback, MutableRefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserFetcherState } from './useUserDataState';
import { useUserDataFetching } from './useUserDataFetching';
import { useProfileLoader } from '@/hooks/useProfileLoader';
import { useBalanceLoader } from '@/hooks/useBalanceLoader';
import { useState } from 'react';

export const useUserAuthChecking = (
  isMounted: MutableRefObject<boolean>,
  updateUserData: (data: Partial<UserFetcherState>) => void,
  initialFetchAttempted: MutableRefObject<boolean>
) => {
  const [isLoading, setIsLoading] = useState(true);
  const { loadUserProfile, isNewUser, setIsNewUser } = useProfileLoader();
  const { loadUserBalance } = useBalanceLoader(setIsNewUser);
  
  // Use the userDataFetching hook to handle fetching logic
  const { fetchUserData: fetchData } = useUserDataFetching(
    loadUserProfile,
    loadUserBalance,
    updateUserData,
    setIsLoading,
    isNewUser
  );
  
  // Wrapper function to ensure we're mounted before fetching
  const fetchUserData = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      console.log("Fetching user data...");
      initialFetchAttempted.current = true;
      
      // Check if we have a valid session first
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.error("No valid session found");
        setIsLoading(false);
        return;
      }
      
      // Attempt to refresh token if needed
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.log("Session refresh error:", error);
        } else {
          console.log("User data fetched successfully");
        }
      } catch (refreshErr) {
        console.error("Error refreshing session:", refreshErr);
      }
      
      if (!isMounted.current) return;
      
      // Fetch the actual user data
      await fetchData();
      
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isMounted, fetchData, initialFetchAttempted]);
  
  return {
    fetchUserData,
    isLoading,
    setIsLoading
  };
};
