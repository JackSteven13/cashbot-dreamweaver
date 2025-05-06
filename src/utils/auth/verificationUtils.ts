
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie l'état d'authentification de manière simplifiée
 * Version simplifiée pour éviter les problèmes de connexion
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Récupérer la session actuelle
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error);
      return false;
    }
    
    return !!data.session;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'authentification:", error);
    return false;
  }
};
