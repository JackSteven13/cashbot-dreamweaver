import { useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useUserDataSync = () => {
  const isMounted = useRef(true);
  const isInitialized = useRef(false);
  const syncInProgress = useRef(false);
  
  // Improved sync function with better error handling and retries
  const syncUserData = useCallback(async (force = false): Promise<boolean> => {
    // Prevent multiple simultaneous syncs
    if (syncInProgress.current || !isMounted.current) return false;
    
    try {
      syncInProgress.current = true;
      console.log("Synchronizing user data...");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session, aborting sync");
        syncInProgress.current = false;
        return false;
      }
      
      // Log session details to help with debugging
      console.log(`Syncing data for user: ${session.user.email || session.user.id}`);
      
      // Get user profile data in parallel with balance data
      const [profileResult, balanceResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase.from('user_balances').select('*').eq('id', session.user.id).maybeSingle()
      ]);
      
      // Process profile data
      if (profileResult.data) {
        const { full_name, email } = profileResult.data;
        localStorage.setItem('lastKnownUsername', full_name || (email?.split('@')[0] || 'Utilisateur'));
        
        // Dispatch event to notify components
        window.dispatchEvent(new CustomEvent('username:loaded', { 
          detail: { username: full_name || (email?.split('@')[0] || 'Utilisateur') }
        }));
        
        console.log("Profile data synced successfully");
      } else if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
      }
      
      // Process balance data
      if (balanceResult.data) {
        const { balance, subscription, daily_session_count } = balanceResult.data;
        
        localStorage.setItem('currentBalance', String(balance));
        localStorage.setItem('lastKnownBalance', String(balance));
        localStorage.setItem('subscription', subscription);
        localStorage.setItem('dailySessionCount', String(daily_session_count));
        
        // Dispatch event to notify components
        window.dispatchEvent(new CustomEvent('user:refreshed', { 
          detail: { balance, subscription, daily_session_count }
        }));
        
        console.log("Balance data synced successfully:", { balance, subscription });
      } else if (balanceResult.error) {
        console.error("Error fetching balance:", balanceResult.error);
      }
      
      // Fast initialization for UI
      if (!isInitialized.current) {
        window.dispatchEvent(new CustomEvent('user:fast-init', { 
          detail: { 
            username: localStorage.getItem('lastKnownUsername'),
            subscription: localStorage.getItem('subscription'),
            balance: localStorage.getItem('currentBalance')
          }
        }));
        isInitialized.current = true;
      }
      
      syncInProgress.current = false;
      return true;
    } catch (error) {
      console.error("Error during user data sync:", error);
      syncInProgress.current = false;
      return false;
    }
  }, []);
  
  // Run sync on mount and handle cleanup
  useEffect(() => {
    isMounted.current = true;
    
    // Initial sync with a short delay to ensure auth is ready
    const initialSyncTimeout = setTimeout(() => {
      if (isMounted.current) {
        syncUserData(true);
      }
    }, 300);
    
    // Set up regular sync interval for keeping data fresh
    const syncInterval = setInterval(() => {
      if (isMounted.current && !syncInProgress.current) {
        syncUserData();
      }
    }, 60000); // Sync every minute
    
    // Set up visibility change handler to sync when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted.current) {
        syncUserData(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up all listeners and timeouts on unmount
    return () => {
      isMounted.current = false;
      clearTimeout(initialSyncTimeout);
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncUserData]);
  
  // Expose sync function so it can be called manually if needed
  return { syncUserData };
};

export default useUserDataSync;
