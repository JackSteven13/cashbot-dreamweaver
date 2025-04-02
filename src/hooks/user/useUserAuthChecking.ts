
import { useCallback, MutableRefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserFetcherState } from './useUserDataState';
import { useUserDataFetching } from './useUserDataFetching';
import { useProfileLoader } from '@/hooks/useProfileLoader';
import { useBalanceLoader } from '@/hooks/useBalanceLoader';
import { useState } from 'react';

// Default UserData to prevent undefined errors
const defaultUserData = {
  username: 'utilisateur',
  balance: 0,
  subscription: 'freemium',
  transactions: [],
  referrals: [],
  referralLink: '',
};

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
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // If session check fails, provide default data but mark as not loading
      if (sessionError || !sessionData?.session) {
        console.error("No valid session found or session error:", sessionError);
        
        if (isMounted.current) {
          updateUserData({
            userData: defaultUserData,
            isLoading: false
          });
          setIsLoading(false);
        }
        return;
      }
      
      // Attempt to refresh token if needed
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.log("Session refresh error:", refreshError);
        } else {
          console.log("Session refreshed successfully");
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
        // On error, provide default data but mark as not loading
        updateUserData({
          userData: defaultUserData,
          isLoading: false
        });
        setIsLoading(false);
      }
    }
  }, [isMounted, fetchData, initialFetchAttempted, updateUserData]);
  
  return {
    fetchUserData,
    isLoading,
    setIsLoading
  };
};
