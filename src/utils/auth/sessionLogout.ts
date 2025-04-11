
import { supabase } from "@/integrations/supabase/client";

/**
 * Clears all session data and forces a complete sign out with timeout protection
 * @returns Promise<boolean> true if successful, false otherwise
 */
export const forceSignOut = async (): Promise<boolean> => {
  try {
    console.log("Performing complete sign out...");
    
    // Protection contre les appels simultanés
    if (localStorage.getItem('auth_signing_out') === 'true') {
      console.log("Sign out already in progress");
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 5000);
      });
      
      // Attendre la fin ou le timeout
      return await timeoutPromise;
    }
    
    localStorage.setItem('auth_signing_out', 'true');
    const timeout = setTimeout(() => {
      localStorage.removeItem('auth_signing_out');
    }, 10000);
    
    try {
      // Clear all Supabase-related items from localStorage
      const keysToRemove = [
        'supabase.auth.token',
        'supabase.auth.expires_at',
        'supabase.auth.refresh_token',
        'sb-cfjibduhagxiwqkiyhqd-auth-token',
        'sb-cfjibduhagxiwqkiyhqd-auth-refresh',
        'auth_checking',
        'auth_refreshing',
        'auth_redirecting',
        'auth_check_timestamp',
        'auth_refresh_timestamp',
        'auth_redirect_timestamp',
        'user_registered',
        'username',
        'user_balance',
        'daily_session_count', 
        'subscription'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Error removing key ${key}:`, e);
        }
      });
      
      // Pause pour permettre aux opérations locales de se terminer
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Perform signout with global scope and ignoring session errors
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        console.error("Error during supabase signOut:", signOutError);
        // Continue même en cas d'erreur pour assurer un nettoyage complet
      }
      
      // Court délai supplémentaire pour laisser les opérations de déconnexion se terminer
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("User signed out successfully");
      clearTimeout(timeout);
      localStorage.removeItem('auth_signing_out');
      
      return true;
    } catch (innerError) {
      console.error("Inner error during sign out:", innerError);
      clearTimeout(timeout);
      localStorage.removeItem('auth_signing_out');
      return false;
    }
  } catch (error) {
    console.error("Error during sign out:", error);
    localStorage.removeItem('auth_signing_out');
    return false;
  }
};
