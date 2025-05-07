
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the current user session with improved reliability
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    // Petite attente pour éviter les problèmes de concurrence
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Utiliser getSession avec robustesse
    const { data, error } = await supabase.auth.getSession();
    
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
