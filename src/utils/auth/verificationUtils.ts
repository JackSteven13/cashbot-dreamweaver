
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie l'état d'authentification de manière stable avec persistance améliorée
 * @returns Une promesse qui résout à true si l'utilisateur est authentifié, false sinon
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Petit délai pour permettre au contexte d'authentification de s'initialiser correctement
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log("Verifying authentication status");
    
    // Vérifier d'abord si une session est présente dans localStorage
    const hasLocalSession = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    if (!hasLocalSession) {
      console.log("No local session found");
      return false;
    }
    
    // Vérifier la session actuelle avec persistance activée
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return false;
    }
    
    // Vérification plus stricte de la validité de la session
    if (data.session && data.session.user && data.session.user.id) {
      // Vérifier si la session n'a pas expiré
      const tokenExpiry = new Date((data.session.expires_at || 0) * 1000);
      const now = new Date();
      
      if (now > tokenExpiry) {
        console.log("Session expirée, tentative de rafraîchissement automatique...");
        
        try {
          // Petit délai pour éviter les conflits de rafraîchissement
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Tentative de rafraîchissement automatique
          const refreshResult = await supabase.auth.refreshSession();
          
          if (refreshResult.error || !refreshResult.data.session) {
            console.error("Échec du rafraîchissement de session:", refreshResult.error);
            
            // Si le token a expiré et le rafraîchissement a échoué, nettoyer le localStorage
            localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
            localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
            
            return false;
          }
          
          // Vérification supplémentaire du token rafraîchi
          const newTokenExpiry = new Date((refreshResult.data.session.expires_at || 0) * 1000);
          if (now > newTokenExpiry) {
            console.error("Token rafraîchi déjà expiré");
            return false;
          }
          
          console.log("Session rafraîchie avec succès");
          return true;
        } catch (refreshError) {
          console.error("Erreur lors du rafraîchissement:", refreshError);
          return false;
        }
      }
      
      console.log("Valid session found for user:", data.session.user.id);
      return true;
    }
    
    console.log("No valid session found");
    return false;
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return false;
  }
};

/**
 * Vérifie périodiquement l'état d'authentification et déclenche des rafraîchissements
 * pour maintenir l'état de session actif
 */
export const scheduleAuthRefresh = (): (() => void) => {
  const intervalId = setInterval(async () => {
    try {
      console.log("Scheduled auth refresh check running");
      
      // Vérifier d'abord si une session est présente localement
      const hasLocalSession = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      
      if (!hasLocalSession) {
        return; // Ne pas essayer de rafraîchir s'il n'y a pas de session
      }
      
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // Si la session existe, vérifier si elle expire bientôt
        const tokenExpiry = new Date((data.session.expires_at || 0) * 1000);
        const now = new Date();
        const timeUntilExpiry = tokenExpiry.getTime() - now.getTime();
        
        // Si le token expire dans moins de 10 minutes, le rafraîchir
        if (timeUntilExpiry < 10 * 60 * 1000) {
          console.log("Token expires soon, refreshing...");
          await supabase.auth.refreshSession();
        }
      }
    } catch (error) {
      console.error("Error in scheduled auth refresh:", error);
    }
  }, 3 * 60 * 1000); // Vérifier toutes les 3 minutes
  
  // Retourner une fonction de nettoyage
  return () => clearInterval(intervalId);
};
