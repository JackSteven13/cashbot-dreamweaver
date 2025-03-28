
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the current user session with improved persistence
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    console.log("Getting current session");
    
    // Get the session from Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    // Validate the session
    if (data.session && data.session.user && data.session.user.id) {
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
 * Refreshes the current session
 * @returns The refreshed session or null if refresh failed
 */
export const refreshSession = async () => {
  try {
    console.log("Attempting to refresh the session");
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
    
    if (data.session) {
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
    
    // Clear all localStorage items
    const keysToRemove = [
      'supabase.auth.token',
      'supabase.auth.expires_at',
      'supabase.auth.refresh_token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'sb-cfjibduhagxiwqkiyhqd-auth-refresh',
      'user_registered',
      'username',
      'user_balance',
      'daily_session_count', 
      'subscription',
      'user_data',
      'last_logged_in_email'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Perform sign out with Supabase
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error("Error during signOut API call:", error);
      return false;
    }
    
    console.log("User signed out successfully");
    return true;
  } catch (error) {
    console.error("Error during sign out:", error);
    return false;
  }
};
