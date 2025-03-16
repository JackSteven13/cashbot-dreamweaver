
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
 * Clears session cache and forces sign out
 */
export const forceSignOut = async () => {
  try {
    // Suppression complète de la session locale
    await supabase.auth.signOut({ scope: 'local' });
    
    // Effacer les données locales potentiellement en cache
    localStorage.removeItem('supabase.auth.token');
    
    // Confirmez le succès
    console.log("User signed out successfully");
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
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
    // Vérifier la session actuelle
    const session = await getCurrentSession();
    
    if (session) {
      console.log("Valid session found");
      return true;
    }
    
    // Tentative de rafraîchissement si pas de session valide
    console.log("No valid session, attempting refresh");
    const refreshedSession = await refreshSession();
    
    if (refreshedSession) {
      console.log("Session restored via refresh");
      return true;
    }
    
    // Aucune session valide après tentative de réparation
    console.log("Authentication verification failed");
    return false;
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return false;
  }
};
