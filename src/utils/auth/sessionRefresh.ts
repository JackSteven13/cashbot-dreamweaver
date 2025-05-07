
import { supabase } from '@/integrations/supabase/client';

/**
 * Essaie de rafraîchir la session de l'utilisateur
 * @returns true si le rafraîchissement a réussi, false sinon
 */
export const refreshSession = async (): Promise<boolean> => {
  try {
    console.log("Tentative de rafraîchissement de la session...");
    
    // Utiliser un contrôleur d'abandon pour limiter le temps d'attente
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const { data, error } = await supabase.auth.refreshSession();
    clearTimeout(timeoutId);
    
    if (error) {
      console.error("Erreur lors du rafraîchissement de la session:", error);
      return false;
    }
    
    if (!data || !data.session) {
      console.log("Aucune session après rafraîchissement");
      return false;
    }
    
    console.log("Session rafraîchie avec succès");
    return true;
  } catch (error) {
    console.error("Exception lors du rafraîchissement de la session:", error);
    return false;
  }
};
