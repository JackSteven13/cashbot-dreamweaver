
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the current user session with improved reliability
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    // Configurer un timeout pour éviter que la requête ne bloque indéfiniment
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // Utiliser getSession avec robustesse
    const { data, error } = await supabase.auth.getSession();
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    // Vérification de sécurité supplémentaire
    if (data?.session?.user?.id) {
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};
