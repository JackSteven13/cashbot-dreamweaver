
import { supabase } from "@/integrations/supabase/client";

/**
 * Version ultra simplifiée de la récupération de session - méthode directe
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
