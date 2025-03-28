
import { supabase } from "@/integrations/supabase/client";

/**
 * Verify authentication state
 * @returns A promise that resolves to true if authenticated, false otherwise
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Performing auth verification");
    
    // Get current session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return false;
    }
    
    // Verify session validity
    if (data.session && data.session.user && data.session.user.id) {
      console.log("Session found, checking if valid");
      
      // Check if session hasn't expired
      const tokenExpiry = new Date((data.session.expires_at || 0) * 1000);
      const now = new Date();
      
      if (now > tokenExpiry) {
        console.log("Session expired, attempting automatic refresh");
        
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error("Failed to refresh session:", refreshError);
          return false;
        }
        
        console.log("Session refreshed successfully");
        return true;
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
