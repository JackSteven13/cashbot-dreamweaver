
import { supabase } from "@/integrations/supabase/client";

/**
 * Force la déconnexion complète de l'utilisateur
 * Version stable qui gère correctement les erreurs et la persistance
 */
export const forceSignOut = async () => {
  try {
    // Nettoyage complet des tokens locaux avant la tentative de déconnexion
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
    localStorage.removeItem('sb-auth-token');
    
    // Nettoyer tous les flags potentiellement bloquants
    localStorage.removeItem('auth_checking');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_redirecting');
    localStorage.removeItem('auth_check_timestamp');
    localStorage.removeItem('auth_refresh_timestamp');
    localStorage.removeItem('auth_redirect_timestamp');
    
    // Tenter une déconnexion propre
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log("Erreur lors de la déconnexion supabase:", error);
      // Continuer malgré l'erreur puisque nous avons déjà nettoyé les tokens
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la déconnexion forcée:", error);
    return false;
  }
};
