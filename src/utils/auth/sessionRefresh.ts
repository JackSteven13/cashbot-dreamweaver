
import { supabase } from "@/integrations/supabase/client";

/**
 * Tente de rafraîchir la session utilisateur actuelle
 * Version simplifiée pour plus de fiabilité
 * @returns La nouvelle session si le rafraîchissement a réussi, sinon null
 */
export const refreshSession = async () => {
  try {
    console.log("Tentative de rafraîchissement de la session");
    
    // Vérifier si nous avons déjà une session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.log("Pas de session active à rafraîchir");
      return null;
    }
    
    // Utiliser le endpoint de rafraîchissement de session avec des options simples
    const { data, error } = await supabase.auth.refreshSession();
    
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
    return null;
  }
};
