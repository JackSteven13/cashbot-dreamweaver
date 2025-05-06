
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

/**
 * Force la déconnexion de l'utilisateur et nettoie toutes les données d'authentification
 */
export const forceSignOut = async (): Promise<void> => {
  try {
    // Déconnecter via l'API Supabase d'abord
    await supabase.auth.signOut({
      scope: 'global', // Déconnexion de tous les appareils
    });
    
    // Nettoyer tous les jetons et données d'authentification stockés localement
    clearStoredAuthData();
    
    console.log("Déconnexion forcée réussie");
  } catch (error) {
    console.error("Erreur lors de la déconnexion forcée:", error);
    
    // Même en cas d'erreur, tenter de nettoyer le stockage local
    clearStoredAuthData();
    
    // Relancer l'erreur pour permettre un traitement supplémentaire si nécessaire
    throw error;
  }
};
