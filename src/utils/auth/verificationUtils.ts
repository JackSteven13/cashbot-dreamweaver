
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie l'état d'authentification de manière stable
 * @returns Une promesse qui résout à true si l'utilisateur est authentifié, false sinon
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Ajout d'un délai pour permettre au contexte d'authentification de s'initialiser correctement
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Vérifier la session actuelle
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return false;
    }
    
    // Vérification plus stricte de la validité de la session
    if (data.session && data.session.user && data.session.user.id) {
      // Vérifier si la session n'a pas expiré
      const tokenExpiry = new Date((data.session.expires_at || 0) * 1000);
      const now = new Date();
      
      if (now > tokenExpiry) {
        console.log("Session expirée, tentative de rafraîchissement...");
        // Tentons de rafraîchir automatiquement
        const refreshResult = await supabase.auth.refreshSession();
        if (refreshResult.error || !refreshResult.data.session) {
          console.error("Échec du rafraîchissement de session:", refreshResult.error);
          return false;
        }
        console.log("Session rafraîchie avec succès");
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
