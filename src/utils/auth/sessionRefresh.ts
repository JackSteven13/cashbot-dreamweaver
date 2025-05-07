
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
    
    // Utiliser refreshSession avec timeout pour éviter les blocages
    const timeoutPromise = new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error("Timeout lors du rafraîchissement de la session")), 5000);
    });
    
    const refreshPromise = supabase.auth.refreshSession();
    
    // Race entre le timeout et la requête de rafraîchissement
    const { data, error } = await Promise.race([
      refreshPromise,
      timeoutPromise.then(() => ({ data: { session: null }, error: new Error("Timeout") }))
    ]) as any;
    
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
