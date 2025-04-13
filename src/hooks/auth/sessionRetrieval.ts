
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the current user session with improved persistence
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    // Court délai pour éviter les problèmes de concurrence
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Vérifier d'abord si une session est présente dans localStorage
    const hasLocalSession = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    if (!hasLocalSession) {
      console.log("No local session found");
      return null;
    }
    
    // Utiliser getSession avec la persistance locale activée par défaut
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    // Add extra validation to ensure session is complete
    if (data.session && data.session.user && data.session.user.id) {
      // Vérifier si la session n'a pas expiré
      const tokenExpiry = new Date((data.session.expires_at || 0) * 1000);
      const now = new Date();
      
      if (now > tokenExpiry) {
        console.log("Session expired, attempting automatic refresh...");
        // Using supabase.auth directly instead of imported refreshSession to avoid circular dependency
        const { data: refreshData } = await supabase.auth.refreshSession();
        return refreshData.session;
      }
      
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};
