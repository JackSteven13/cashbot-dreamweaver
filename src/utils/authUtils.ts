
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Gets the current user session
 * @returns The user session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    // Récupérer la session directement
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
export const forceSignOut = async (): Promise<boolean> => {
  try {
    console.log("Performing complete sign out...");
    
    // Nettoyer toutes les données locales avant la déconnexion
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.expires_at');
    localStorage.removeItem('supabase.auth.refresh_token');
    
    // Nettoyer également le localStorage pour plus de sûreté
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.log("Error clearing localStorage items:", e);
    }
    
    // Supprimer tous les cookies liés à l'authentification
    document.cookie.split(";").forEach(cookie => {
      const [name] = cookie.trim().split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    });
    
    // Effectuer la déconnexion avec portée globale ensuite
    await supabase.auth.signOut({ scope: 'global' });
    
    // Attendre un moment plus long pour s'assurer que la déconnexion est traitée
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Vérifier que la déconnexion a bien fonctionné
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      console.warn("Session still exists after signout attempt, trying again");
      await supabase.auth.signOut({ scope: 'global' });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
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
    
    // Vérifier immédiatement que la session est valide
    const { data: { session: verifiedSession } } = await supabase.auth.getSession();
    if (!verifiedSession) {
      console.warn("Session not verified after refresh");
      return null;
    }
    
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
    console.log("Vérification de l'authentification...");
    
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
      
      // Test direct pour vérifier si l'utilisateur peut accéder à ses données
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("User data error despite valid session:", userError);
        // La session semble valide mais l'utilisateur ne peut pas être récupéré
        const newSession = await refreshSession();
        return !!newSession;
      }
      
      if (userData && userData.user) {
        // Get user profile to ensure name is retrieved
        try {
          // Special handling for kayzerslotern@gmail.com - Always set display name to "Dickerson"
          if (userData.user.email === "kayzerslotern@gmail.com") {
            // Update profile to ensure full_name is set to "Dickerson"
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({ 
                id: userData.user.id, 
                full_name: "Dickerson",
                email: "kayzerslotern@gmail.com" 
              }, { onConflict: 'id' });
              
            if (upsertError) {
              console.error("Error updating profile for kayzerslotern@gmail.com:", upsertError);
            } else {
              console.log("Profile updated for kayzerslotern@gmail.com with name: Dickerson");
            }
          }
          
          // Get updated profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userData.user.id)
            .maybeSingle();
            
          console.log("Profile data retrieved:", profileData);
        } catch (e) {
          console.error("Error retrieving profile:", e);
        }
        
        console.log("Valid session confirmed with user data");
        return true;
      }
      
      console.log("Session exists but no user data found");
      return false;
    }
    
    // Aucune session trouvée, essayer de rafraîchir
    console.log("No valid session, attempting refresh");
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshData.session) {
      console.log("Session refresh failed");
      return false;
    }
    
    // Vérification supplémentaire après rafraîchissement
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      console.log("User data not available after refresh");
      return false;
    }
    
    console.log("Session restored via refresh");
    return true;
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return false;
  }
};
