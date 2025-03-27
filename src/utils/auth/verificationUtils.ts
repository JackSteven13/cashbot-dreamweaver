
import { supabase } from "@/integrations/supabase/client";

/**
 * Verify authentication state with improved persistence
 * @returns A promise that resolves to true if authenticated, false otherwise
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Performing auth verification");
    
    // Get current session with persistence enabled
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return false;
    }
    
    // More strict verification of session validity
    if (data.session && data.session.user && data.session.user.id) {
      console.log("Session found, checking if valid");
      
      // Check if session hasn't expired
      const tokenExpiry = new Date((data.session.expires_at || 0) * 1000);
      const now = new Date();
      
      if (now > tokenExpiry) {
        console.log("Session expired, attempting automatic refresh...");
        // Attempt automatic refresh
        const refreshResult = await supabase.auth.refreshSession();
        if (refreshResult.error || !refreshResult.data.session) {
          console.error("Failed to refresh session:", refreshResult.error);
          return false;
        }
        
        // Additional check of refreshed token
        const newTokenExpiry = new Date((refreshResult.data.session.expires_at || 0) * 1000);
        if (now > newTokenExpiry) {
          console.error("Refreshed token already expired");
          return false;
        }
        
        console.log("Session refreshed successfully");
        return true;
      }
      
      // Make an extra verification check with the API to ensure the session is valid
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error("Invalid user data despite valid session token:", userError);
        return false;
      }
      
      console.log("Valid session found for user:", data.session.user.id);
      return true;
    }
    
    console.log("No valid session found");
    return false;
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return false;
  }
};
