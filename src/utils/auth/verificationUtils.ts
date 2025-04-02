
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie l'état d'authentification de manière stable avec persistance améliorée
 * @returns Une promesse qui résout à true si l'utilisateur est authentifié, false sinon
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Petit délai pour permettre au contexte d'authentification de s'initialiser complètement
    await new Promise(resolve => setTimeout(resolve, 100));
    
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

// Nous n'exportons plus cette fonction ici pour éviter le conflit
// Elle sera disponible via sessionUtils
const refreshSessionInternal = async (): Promise<boolean> => {
  try {
    console.log("Tentative de rafraîchissement de la session");
    
    // Récupérer la session actuelle d'abord
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Si nous n'avons pas de session, pas besoin de rafraîchir
    if (!sessionData.session) {
      console.log("Pas de session à rafraîchir");
      return false;
    }
    
    // Rafraîchir la session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error("Échec du rafraîchissement de la session:", error);
      return false;
    }
    
    console.log("Session rafraîchie avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors du rafraîchissement de la session:", error);
    return false;
  }
};
