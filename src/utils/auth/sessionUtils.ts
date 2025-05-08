
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

/**
 * Force la déconnexion de l'utilisateur et nettoie toutes les données d'authentification
 */
export const forceSignOut = async (): Promise<void> => {
  console.log("Tentative de déconnexion forcée");
  
  try {
    // Nettoyer toutes les données d'authentification pour éviter les conflits
    clearStoredAuthData();
    
    // Déconnecter via l'API Supabase - sans options obsolètes
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

/**
 * Récupère la session utilisateur actuelle
 * @returns La session utilisateur ou null si non authentifié
 */
export const getCurrentSession = async () => {
  try {
    // Utiliser getSession avec la méthode la plus simple
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

/**
 * Essaie de rafraîchir la session de l'utilisateur
 * @returns La session rafraîchie ou null si échec
 */
export const refreshSession = async () => {
  try {
    console.log("Tentative de rafraîchissement de la session...");
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Erreur lors du rafraîchissement de la session:", error);
      return null;
    }
    
    console.log("Session rafraîchie avec succès");
    return data.session;
  } catch (error) {
    console.error("Exception lors du rafraîchissement de la session:", error);
    return null;
  }
};
