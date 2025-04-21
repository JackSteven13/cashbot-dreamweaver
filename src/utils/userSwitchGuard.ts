
import { supabase } from "@/integrations/supabase/client";
import balanceManager from "./balance/balanceManager";

/**
 * Clear all local data when a user signs out
 */
export const cleanupOnSignout = () => {
  console.log("Cleaning up user data on signout");
  
  // Clean up balance manager data
  balanceManager.cleanupUserBalanceData();
  
  // Clean up other localStorage data
  localStorage.removeItem('lastKnownUsername');
  localStorage.removeItem('lastKnownBalance');
  localStorage.removeItem('cachedTransactions');
  localStorage.removeItem('transactionsLastRefresh');
  localStorage.removeItem('lastSessionTimestamp');
  
  // Reset any active flags
  localStorage.removeItem('auth_checking');
  localStorage.removeItem('auth_check_timestamp');
  localStorage.removeItem('auth_redirecting');
  localStorage.removeItem('auth_redirect_timestamp');
  
  console.log("User data cleanup complete");
};

/**
 * Set user switch handler to listen for auth state changes
 */
export const setupUserSwitchHandler = () => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      console.log("User signed out, cleaning up data");
      balanceManager.cleanupUserBalanceData();
      
      // Clean up other localStorage data
      localStorage.removeItem('lastKnownUsername');
      localStorage.removeItem('lastKnownBalance');
    } else if (event === 'SIGNED_IN' && session?.user?.id) {
      console.log(`User signed in, setting user ID: ${session.user.id}`);
      balanceManager.setUserId(session.user.id);
    }
  });
  
  return subscription;
};

/**
 * Reset all user data (for testing/admin purposes)
 */
export const resetAllUserData = () => {
  balanceManager.cleanupUserBalanceData();
  localStorage.clear();
  sessionStorage.clear();
  console.log("All user data reset");
};
