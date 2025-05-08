
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import balanceManager from '@/utils/balance/balanceManager';

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
      
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      
      if (!session) {
        console.log("No active session, skipping sync");
        localStorage.removeItem('data_syncing');
        return false;
      }
      
      // Use a more reliable approach to wait for session establishment
      let attempts = 0;
      const maxAttempts = 5; // Increased for better reliability
      let syncSuccess = false;
      
      while (attempts < maxAttempts && !syncSuccess && mountedRef.current) {
        try {
          // Add progressive delay between attempts
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 300 * attempts));
          }
          
          // Fetch user data with parallel queries
          const userBalancePromise = supabase
            .from('user_balances')
            .select('subscription, balance, daily_session_count')
            .eq('id', session.user.id)
            .maybeSingle();
            
          const profilePromise = supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', session.user.id)
            .maybeSingle();
            
          const [userBalanceResult, profileResult] = await Promise.all([userBalancePromise, profilePromise]);
          
          // Check results and update localStorage
          if (!userBalanceResult.error && userBalanceResult.data) {
            const userData = userBalanceResult.data;
            // Update subscription in localStorage
            if (userData.subscription) {
              localStorage.setItem('subscription', userData.subscription);
              localStorage.setItem(`subscription_${session.user.id}`, userData.subscription);
              console.log("Subscription updated:", userData.subscription);
            }
            
            // Update balance in localStorage
            if (userData.balance !== undefined) {
              localStorage.setItem('currentBalance', String(userData.balance));
              localStorage.setItem('lastKnownBalance', String(userData.balance));
              localStorage.setItem(`currentBalance_${session.user.id}`, String(userData.balance));
              localStorage.setItem(`lastKnownBalance_${session.user.id}`, String(userData.balance));
              console.log("Balance updated:", userData.balance);
            }
            
            // Update daily session count
            if (userData.daily_session_count !== undefined) {
              localStorage.setItem('dailySessionCount', String(userData.daily_session_count));
              localStorage.setItem(`dailySessionCount_${session.user.id}`, String(userData.daily_session_count));
              console.log("Session count updated:", userData.daily_session_count);
            }
            
            syncSuccess = true;
          } else if (userBalanceResult.error) {
            console.error("Error fetching balance:", userBalanceResult.error);
          }
          
          // Get and store username
          if (!profileResult.error && profileResult.data && profileResult.data.full_name) {
            localStorage.setItem('lastKnownUsername', profileResult.data.full_name);
            localStorage.setItem(`lastKnownUsername_${session.user.id}`, profileResult.data.full_name);
            console.log("Username updated:", profileResult.data.full_name);
            syncSuccess = true;
            
            // Dispatch event to notify that the username is available
            window.dispatchEvent(new CustomEvent('username:loaded', { 
              detail: { username: profileResult.data.full_name }
            }));
          } else if (session.user.user_metadata?.full_name) {
            // Fallback to user metadata
            localStorage.setItem('lastKnownUsername', session.user.user_metadata.full_name);
            localStorage.setItem(`lastKnownUsername_${session.user.id}`, session.user.user_metadata.full_name);
            console.log("Username retrieved from metadata:", session.user.user_metadata.full_name);
            syncSuccess = true;
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('username:loaded', { 
              detail: { username: session.user.user_metadata.full_name }
            }));
          } else if (session.user.email) {
            // Use email as fallback for username
            const emailUsername = session.user.email.split('@')[0];
            localStorage.setItem('lastKnownUsername', emailUsername);
            localStorage.setItem(`lastKnownUsername_${session.user.id}`, emailUsername);
            console.log("Username fallback to email:", emailUsername);
            syncSuccess = true;
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('username:loaded', { 
              detail: { username: emailUsername }
            }));
          } else if (profileResult.error) {
            console.error("Error fetching profile:", profileResult.error);
          }
          
          if (!syncSuccess) {
            attempts++;
            console.log(`Sync attempt ${attempts}/${maxAttempts} incomplete, retrying...`);
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
        
        // Trigger event to force UI update
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { 
            balance: localStorage.getItem('currentBalance'),
            subscription: localStorage.getItem('subscription') 
          }
        }));
      }
      
      // If synchronization failed after multiple attempts
      if (!syncSuccess && attempts >= maxAttempts) {
        console.error("Synchronization failed after multiple attempts");
        
        // Notify user if failure
        if (mountedRef.current) {
          toast({
            title: "Synchronisation des données",
            description: "Un problème est survenu lors de la récupération des données. Certaines fonctionnalités pourraient ne pas être disponibles.",
            variant: "destructive",
            duration: 5000
          });
        }
      }
      
      localStorage.removeItem('data_syncing');
      return syncSuccess;
    } catch (error) {
      console.error("Error syncing user data:", error);
      localStorage.removeItem('data_syncing');
      
      // Dispatch event to inform about sync error
      window.dispatchEvent(new CustomEvent('user:sync-error', { 
        detail: { error: String(error) }
      }));
      
      return false;
    }
  }, [mountedRef]);

  return { syncUserData };
};

export default useUserDataSync;
