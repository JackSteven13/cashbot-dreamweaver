
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the current user session with improved persistence
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    // Léger délai pour éviter les problèmes de concurrence
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Utiliser getSession avec la persistance locale activée par défaut
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    // Add extra validation to ensure session is complete
    if (data.session && data.session.user && data.session.user.id) {
      // Vérifier si la session n'a pas expiré
      const tokenExpiry = new Date((data.session.expires_at || 0) * 1000);
      const now = new Date();
      
      if (now > tokenExpiry) {
        console.log("Session expired, attempting automatic refresh...");
        const refreshed = await refreshSession();
        return refreshed;
      }
      
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

/**
 * Refreshes the current session with improved persistence
 */
export const refreshSession = async () => {
  try {
    console.log("Attempting to refresh the session");
    
    // Utiliser refreshSession avec persistance
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
    
    // Validate the refreshed session
    if (data.session && data.session.user && data.session.user.id) {
      // Vérification supplémentaire du token rafraîchi
      const newTokenExpiry = new Date((data.session.expires_at || 0) * 1000);
      const now = new Date();
      
      if (now > newTokenExpiry) {
        console.error("Refreshed token already expired");
        return null;
      }
      
      console.log("Session refreshed successfully");
      return data.session;
    }
    
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
    
    // Clear local storage (without removing all items, just auth-related ones)
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.expires_at');
    localStorage.removeItem('supabase.auth.refresh_token');
    
    // Pause pour permettre aux opérations locales de se terminer
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Perform more stable sign out
    await supabase.auth.signOut({ scope: 'local' });
    
    // Short delay for sign out to process
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.log("User signed out successfully");
    return true;
  } catch (error) {
    console.error("Error during sign out:", error);
    return false;
  }
};
