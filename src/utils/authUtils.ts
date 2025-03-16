
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Gets the current user session
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    // Récupérer la session directement sans vérification préalable
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    if (!session) {
      console.log("No active session found");
      return null;
    }
    
    // Vérifier si le token est valide et non expiré
    const tokenExpiry = new Date(session.expires_at * 1000);
    const now = new Date();
    
    if (now > tokenExpiry) {
      console.log("Session token expired, attempting refresh");
      const refreshedSession = await refreshSession();
      return refreshedSession;
    }
    
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

/**
 * Checks if a user is at their daily limit based on subscription and balance
 */
export const checkDailyLimit = (balance: number, subscription: string) => {
  // Import this from subscriptionUtils if needed
  const SUBSCRIPTION_LIMITS: Record<string, number> = {
    'freemium': 0.5,
    'pro': 5,
    'visionnaire': 20,
    'alpha': 50
  };
  
  return balance >= (SUBSCRIPTION_LIMITS[subscription] || 0.5);
};

/**
 * Clears all session data and forces a complete sign out
 * @returns Promise<boolean> true if successful, false otherwise
 */
export const forceSignOut = async () => {
  try {
    // Effectuer la déconnexion avec portée globale d'abord
    await supabase.auth.signOut({ scope: 'global' });
    
    // Attendre un court instant pour s'assurer que la déconnexion est traitée
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Nettoyer toutes les données locales
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.expires_at');
    localStorage.removeItem('supabase.auth.refresh_token');
    
    // Supprimer tous les cookies liés à l'authentification
    document.cookie.split(";").forEach(cookie => {
      const [name] = cookie.trim().split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    });
    
    console.log("User signed out and all session data cleared");
    return true;
  } catch (error) {
    console.error("Error during forced sign out:", error);
    return false;
  }
};

/**
 * Refreshes the current session to ensure fresh authentication
 */
export const refreshSession = async () => {
  try {
    console.log("Attempting to refresh the session");
    
    // Tentative de rafraîchissement standard de la session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
    
    if (!data.session) {
      console.log("No session returned after refresh");
      return null;
    }
    
    console.log("Session refreshed successfully");
    return data.session;
  } catch (error) {
    console.error("Error refreshing session:", error);
    return null;
  }
};

/**
 * Vérifie l'état d'authentification et répare une session si possible
 * @returns Une promesse qui résout à true si l'utilisateur est authentifié, false sinon
 */
export const verifyAndRepairAuth = async (): Promise<boolean> => {
  try {
    // Première tentative - Vérifier la session actuelle
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return false;
    }
    
    if (session) {
      // Vérifier si le token est expiré
      const tokenExpiry = new Date(session.expires_at * 1000);
      const now = new Date();
      
      if (now > tokenExpiry) {
        console.log("Session token expired, attempting refresh");
        const refreshResult = await refreshSession();
        return !!refreshResult;
      }
      
      console.log("Valid session found");
      return true;
    }
    
    // Aucune session trouvée, essayer de rafraîchir
    console.log("No valid session, attempting refresh");
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshData.session) {
      console.log("Session refresh failed, trying recovery...");
      
      // Dernière tentative - Nettoyer et récupérer la session si possible
      await forceSignOut();
      const { data: recoveryData } = await supabase.auth.getSession();
      
      if (recoveryData.session) {
        console.log("Session recovered after cleanup");
        return true;
      }
      
      console.log("Session recovery failed, no valid auth");
      return false;
    }
    
    console.log("Session restored via refresh");
    return true;
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return false;
  }
};
