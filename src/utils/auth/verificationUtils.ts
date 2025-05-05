
import { supabase } from '@/integrations/supabase/client';

/**
 * Vérifie si l'utilisateur est authentifié - version ultra simplifiée et robuste
 * @returns Une promesse qui résout à un booléen indiquant si l'utilisateur est authentifié
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Version ultra simplifiée - récupère juste la session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Erreur lors de la vérification d'authentification:", error);
      return false;
    }
    
    // Vérification explicite de l'existence et de la validité de la session
    if (!data || !data.session || !data.session.user) {
      console.log("Aucune session valide trouvée");
      return false;
    }
    
    // Session valide trouvée
    console.log("Session valide trouvée pour l'utilisateur:", data.session.user.email);
    return true;
  } catch (error) {
    console.error("Exception lors de la vérification d'authentification:", error);
    return false;
  }
};

/**
 * Version plus robuste de isUserAuthenticated
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  return await verifyAuth();
};
