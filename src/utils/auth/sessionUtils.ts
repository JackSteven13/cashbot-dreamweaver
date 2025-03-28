
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the current user session with improved persistence
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    console.log("Getting current session");
    
    // Use getSession with local persistence enabled by default
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    // Add extra validation to ensure session is complete
    if (data.session && data.session.user && data.session.user.id) {
      // Check if the session hasn't expired
      const tokenExpiry = new Date((data.session.expires_at || 0) * 1000);
      const now = new Date();
      
      if (now > tokenExpiry) {
        console.log("Session expired, attempting automatic refresh...");
        const refreshed = await refreshSession();
        return refreshed;
      }
      
      console.log("Valid session found for user:", data.session.user.id);
      return data.session;
    }
    
    console.log("No session found");
    return null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

/**
 * Refreshes the current session with improved persistence
 * @returns The refreshed session or null if refresh failed
 */
export const refreshSession = async () => {
  try {
    console.log("Attempting to refresh the session");
    
    // First check if there is a session to refresh
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.log("No session to refresh");
      return null;
    }
    
    // To avoid deadlocks, use a simplified refresh approach
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
    
    // Validate the refreshed session
    if (data.session && data.session.user && data.session.user.id) {
      // Additional check of refreshed token
      const newTokenExpiry = new Date((data.session.expires_at || 0) * 1000);
      const now = new Date();
      
      if (now > newTokenExpiry) {
        console.error("Refreshed token already expired");
        return null;
      }
      
      console.log("Session refreshed successfully");
      return data.session;
    }
    
    console.log("No valid session after refresh");
    return null;
  } catch (error) {
    console.error("Error refreshing session:", error);
    return null;
  }
};

/**
 * Clears all session data and forces a complete sign out
 * @returns Promise<boolean> true if successful, false otherwise
 */
export const forceSignOut = async (): Promise<boolean> => {
  try {
    console.log("Performing complete sign out...");
    
    // Clear all Supabase-related items from localStorage
    const keysToRemove = [
      'supabase.auth.token',
      'supabase.auth.expires_at',
      'supabase.auth.refresh_token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'sb-cfjibduhagxiwqkiyhqd-auth-refresh',
      'supabase.auth.expires_at',
      'user_registered',
      'username',
      'user_balance',
      'daily_session_count', 
      'subscription',
      'user_data'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Pause to allow local operations to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Perform more stable sign out with local and global scope
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error("Error during signOut API call:", error);
      return false;
    }
    
    // Short delay for sign out to process
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.log("User signed out successfully");
    return true;
  } catch (error) {
    console.error("Error during sign out:", error);
    return false;
  }
};
