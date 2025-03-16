
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Gets the current user session
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    // Add extra validation to ensure session is complete
    if (data.session && data.session.user && data.session.user.id) {
      return data.session;
    }
    
    return null;
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
export const forceSignOut = async (): Promise<boolean> => {
  try {
    console.log("Performing complete sign out...");
    
    // Clear local storage (without removing all items, just auth-related ones)
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.expires_at');
    localStorage.removeItem('supabase.auth.refresh_token');
    
    // Perform more stable sign out
    await supabase.auth.signOut();
    
    // Short delay for sign out to process
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log("User signed out successfully");
    return true;
  } catch (error) {
    console.error("Error during sign out:", error);
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
      return null;
    }
    
    // Validate the refreshed session
    if (data.session && data.session.user && data.session.user.id) {
      console.log("Session refreshed successfully");
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error("Error refreshing session:", error);
    return null;
  }
};

/**
 * Vérifie l'état d'authentification de manière stable
 * @returns Une promesse qui résout à true si l'utilisateur est authentifié, false sinon
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Vérifier la session actuelle
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return false;
    }
    
    if (data.session && data.session.user && data.session.user.id) {
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
