
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie l'état d'authentification de manière stable avec persistance améliorée
 * Version simplifiée
 * @returns Une promesse qui résout à true si l'utilisateur est authentifié, false sinon
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Vérification du statut d'authentification");
    
    // Récupérer la session actuelle
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error);
      return false;
    }
    
    if (!data.session) {
      console.log("Aucune session trouvée");
      return false;
    }
    
    // Vérifier l'expiration du jeton
    const expiresAt = data.session.expires_at;
    if (!expiresAt || Date.now() / 1000 >= expiresAt) {
      console.log("Session expirée, tentative de rafraîchissement");
      
      try {
        // Essayer de rafraîchir la session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.log("Échec du rafraîchissement de la session:", refreshError);
          return false;
        }
        
        console.log("Session rafraîchie avec succès");
        return true;
      } catch (refreshError) {
        console.error("Erreur lors du rafraîchissement de la session:", refreshError);
        return false;
      }
    }
    
    // La session est valide
    console.log("Session valide trouvée pour l'utilisateur:", data.session.user.id);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'authentification:", error);
    return false;
  }
};
