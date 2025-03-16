
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Gets the current user session
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
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
      return await refreshSession();
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
 */
export const forceSignOut = async () => {
  try {
    // Clear auth storage in browser
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
    
    // Clear cookies that might be storing auth state
    document.cookie.split(";").forEach(cookie => {
      const [name] = cookie.trim().split("=");
      if (name.includes("supabase") || name.includes("sb-")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });
    
    // Perform actual sign out with a complete scope
    await supabase.auth.signOut({ scope: 'global' });
    
    console.log("User signed out and all session data cleared");
    return true;
  } catch (error) {
    console.error("Error during forced sign out:", error);
    toast({
      title: "Erreur",
      description: "Une erreur s'est produite pendant la déconnexion.",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Refreshes the current session to ensure fresh authentication
 */
export const refreshSession = async () => {
  try {
    console.log("Attempting to refresh the session");
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Error refreshing session:", error);
      
      // Si erreur de refresh, essayer de nettoyer et forcer la déconnexion
      if (error.message.includes('refresh token')) {
        console.log("Invalid refresh token, forcing sign out");
        await forceSignOut();
      }
      
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
    const session = await getCurrentSession();
    
    if (session) {
      console.log("Valid session found");
      return true;
    }
    
    // Deuxième tentative - Essayer un rafraîchissement de session
    console.log("No valid session, attempting refresh");
    const refreshedSession = await refreshSession();
    
    if (refreshedSession) {
      console.log("Session restored via refresh");
      return true;
    }
    
    // Dernière tentative - Vérifier si l'utilisateur peut être récupéré directement
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      return false;
    }
    
    if (user) {
      console.log("User found but no session, attempting session creation");
      // L'utilisateur existe mais pas de session valide, tenter de forcer une nouvelle session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error("Failed to create new session");
        return false;
      }
      
      console.log("New session created successfully");
      return true;
    }
    
    // Aucune session valide après tentatives de réparation
    console.log("Authentication verification failed");
    return false;
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return false;
  }
};
