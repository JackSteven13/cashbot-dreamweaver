
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the current user session with improved persistence
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    // Léger délai pour éviter les problèmes de concurrence
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Vérifier d'abord si une session est présente dans localStorage
    const hasLocalSession = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    if (!hasLocalSession) {
      console.log("No local session found");
      return null;
    }
    
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
    
    // Vérifier d'abord si une session est présente dans localStorage
    const hasLocalSession = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    if (!hasLocalSession) {
      console.log("No local session to refresh");
      return null;
    }
    
    // Utiliser refreshSession avec persistance
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Error refreshing session:", error);
      
      // Si le rafraîchissement échoue, nettoyer le localStorage
      if (error.message.includes("refresh token is expired") || 
          error.message.includes("invalid refresh token") ||
          error.message.includes("missing refresh token")) {
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
      }
      
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
      'subscription'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Pause pour permettre aux opérations locales de se terminer
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Perform more stable sign out with local and global scope
    await supabase.auth.signOut({ scope: 'global' });
    
    // Short delay for sign out to process
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.log("User signed out successfully");
    return true;
  } catch (error) {
    console.error("Error during sign out:", error);
    return false;
  }
};
