
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

/**
 * Force la déconnexion de l'utilisateur et nettoie toutes les données d'authentification
 */
export const forceSignOut = async (): Promise<void> => {
  console.log("Tentative de déconnexion forcée");
  
  try {
    // Nettoyer toutes les données d'authentification pour éviter les conflits
    clearStoredAuthData();
    
    // Déconnecter via l'API Supabase 
    await supabase.auth.signOut();
    
    // Deuxième nettoyage après la déconnexion
    clearStoredAuthData();
    
    console.log("Déconnexion forcée réussie");
  } catch (error) {
    console.error("Erreur lors de la déconnexion forcée:", error);
    
    // Même en cas d'erreur, tenter de nettoyer le stockage local
    clearStoredAuthData();
  }
};
