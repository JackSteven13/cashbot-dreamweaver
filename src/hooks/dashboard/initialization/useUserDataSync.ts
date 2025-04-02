
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseUserDataSyncParams {
  mountedRef: React.RefObject<boolean>;
}

export const useUserDataSync = ({ mountedRef }: UseUserDataSyncParams) => {
  // Function to synchronize data with better stability
  const syncUserData = useCallback(async () => {
    if (!mountedRef.current) return false;
    
    try {
      console.log("Syncing user data after authentication");
      
      // Check if sync is already in progress
      if (localStorage.getItem('data_syncing') === 'true') {
        console.log("Data sync already in progress, waiting");
        await new Promise(resolve => setTimeout(resolve, 600));
        return true;
      }
      
      localStorage.setItem('data_syncing', 'true');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No active session, skipping sync");
        localStorage.removeItem('data_syncing');
        return false;
      }
      
      // Use a more reliable approach to wait for session establishment
      let attempts = 0;
      const maxAttempts = 3;
      let syncSuccess = false;
      
      while (attempts < maxAttempts && !syncSuccess && mountedRef.current) {
        try {
          // Add progressive delay between attempts
          await new Promise(resolve => setTimeout(resolve, 300 * (attempts + 1)));
          
          const { data: userBalanceData, error } = await supabase
            .from('user_balances')
            .select('subscription')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (!error && userBalanceData) {
            // Update localStorage if necessary
            const localSubscription = localStorage.getItem('subscription');
            
            if (localSubscription !== userBalanceData.subscription) {
              console.log(`Syncing subscription: ${localSubscription} -> ${userBalanceData.subscription}`);
              localStorage.setItem('subscription', userBalanceData.subscription);
            }
            
            syncSuccess = true;
          } else {
            attempts++;
            console.log(`Sync attempt ${attempts}/${maxAttempts} failed, retrying...`);
          }
        } catch (err) {
          attempts++;
          console.error(`Sync attempt ${attempts}/${maxAttempts} error:`, err);
        }
      }
      
      // Check if a forced refresh was requested
      const forceRefresh = localStorage.getItem('forceRefreshBalance');
      if (forceRefresh === 'true') {
        console.log("Force refresh detected, clearing flag");
        localStorage.removeItem('forceRefreshBalance');
      }
      
      localStorage.removeItem('data_syncing');
      return syncSuccess;
    } catch (error) {
      console.error("Error syncing user data:", error);
      localStorage.removeItem('data_syncing');
      return false;
    }
  }, [mountedRef]);

  return { syncUserData };
};
