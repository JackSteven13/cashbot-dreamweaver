
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

/**
 * Force la déconnexion de l'utilisateur et nettoie toutes les données d'authentification
 */
export const forceSignOut = async (): Promise<void> => {
  console.log("Tentative de déconnexion forcée");
  
  try {
    // Nettoyer toutes les données d'authentification pour éviter les conflits
    clearStoredAuthData();
    
    try {
      // Déconnecter via l'API Supabase avec scope global
      await supabase.auth.signOut({ scope: 'global' });
      console.log("Déconnexion API réussie");
    } catch (error) {
      console.error("Erreur API lors de la déconnexion:", error);
    }
    
    // Second nettoyage après la déconnexion
    clearStoredAuthData();
    
    console.log("Déconnexion forcée réussie");
  } catch (error) {
    console.error("Erreur lors de la déconnexion forcée:", error);
    
    // Même en cas d'erreur, tenter de nettoyer le stockage local
    clearStoredAuthData();
  }
  
  // Assurer la suppression de toutes les clés possibles
  try {
    // Rechercher et supprimer toutes les clés liées à Supabase une dernière fois
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error("Erreur lors du nettoyage final:", err);
  }
};
