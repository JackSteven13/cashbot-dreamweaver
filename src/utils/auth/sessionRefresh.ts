
import { supabase } from "@/integrations/supabase/client";

/**
 * Refreshes the current session with improved persistence and stability
 */
export const refreshSession = async () => {
  try {
    // Éviter les rafraîchissements concurrents avec timestamp pour détecter les blocages
    if (localStorage.getItem('auth_refreshing') === 'true') {
      const refreshTimestamp = localStorage.getItem('auth_refresh_timestamp');
      const now = Date.now();
      
      // Si le rafraîchissement est en cours depuis plus de 15 secondes, forcer un nettoyage
      if (refreshTimestamp && now - parseInt(refreshTimestamp) > 15000) {
        console.log("Nettoyage du flag de rafraîchissement bloqué");
        localStorage.removeItem('auth_refreshing');
        localStorage.removeItem('auth_refresh_timestamp');
      } else {
        console.log("Session refresh already in progress, waiting...");
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log("Attempting to refresh the session");
    localStorage.setItem('auth_refreshing', 'true');
    localStorage.setItem('auth_refresh_timestamp', Date.now().toString());
    
    // Vérifier d'abord si une session est présente dans localStorage
    const hasLocalSession = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    if (!hasLocalSession) {
      console.log("No local session to refresh");
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('auth_refresh_timestamp');
      return null;
    }
    
    // Utiliser refreshSession avec persistance explicite
    const { data, error } = await supabase.auth.refreshSession();
    
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_refresh_timestamp');
    
    if (error) {
      console.error("Error refreshing session:", error);
      
      // Si le rafraîchissement échoue, nettoyer le localStorage de façon sélective
      if (error.message.includes("refresh token is expired") || 
          error.message.includes("invalid refresh token") ||
          error.message.includes("missing refresh token")) {
        console.log("Detected expired or invalid refresh token, cleaning up");
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
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_refresh_timestamp');
    return null;
  }
};
