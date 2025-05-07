
import { supabase } from "@/integrations/supabase/client";

/**
 * Tente de rafraîchir la session utilisateur actuelle
 * Version simplifiée avec gestion d'erreur améliorée
 * @returns La nouvelle session si le rafraîchissement a réussi, sinon null
 */
export const refreshSession = async () => {
  try {
    console.log("Tentative de rafraîchissement de la session");
    
    // Vérifier si nous avons déjà une session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Erreur lors de la récupération de la session:", sessionError);
      return null;
    }
    
    if (!sessionData.session) {
      console.log("Pas de session active à rafraîchir");
      return null;
    }
    
    // Utiliser refreshSession avec timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
      
      // Utiliser la méthode de rafraîchissement de session
      const { data, error } = await supabase.auth.refreshSession();
      
      clearTimeout(timeoutId);
      
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
      if (error.name === 'AbortError') {
        console.error("Délai d'attente dépassé lors du rafraîchissement de la session");
      } else {
        console.error("Erreur lors du rafraîchissement de la session:", error);
      }
      return null;
    }
  } catch (error) {
    console.error("Exception lors du rafraîchissement de la session:", error);
    return null;
  }
};
