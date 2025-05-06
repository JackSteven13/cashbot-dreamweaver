
import { supabase } from "@/integrations/supabase/client";

/**
 * Tente de rafraîchir la session utilisateur actuelle
 * Ajouts de résilience pour fonctionner sur différents domaines
 * @returns La nouvelle session si le rafraîchissement a réussi, sinon null
 */
export const refreshSession = async () => {
  try {
    // Marquer le début du rafraîchissement avec un timestamp
    localStorage.setItem('auth_refreshing', 'true');
    localStorage.setItem('auth_refresh_timestamp', Date.now().toString());
    
    console.log("Tentative de rafraîchissement de la session");
    
    // Vérifier si nous avons déjà une session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.log("Pas de session active à rafraîchir");
      
      // Nettoyer les flags de rafraîchissement
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('auth_refresh_timestamp');
      
      return null;
    }
    
    // Utiliser le endpoint de rafraîchissement de session avec des options renforcées
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: sessionData.session.refresh_token,
    });
    
    // Nettoyer les flags de rafraîchissement
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_refresh_timestamp');
    
    if (error) {
      console.error("Erreur lors du rafraîchissement de la session:", error);
      return null;
    }
    
    if (!data.session) {
      console.log("Échec du rafraîchissement de la session - aucune nouvelle session retournée");
      return null;
    }
    
    console.log("Session rafraîchie avec succès");
    return data.session;
  } catch (error) {
    console.error("Exception lors du rafraîchissement de la session:", error);
    
    // Nettoyer les flags de rafraîchissement en cas d'erreur
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_refresh_timestamp');
    
    return null;
  }
};
