
import { supabase } from '@/integrations/supabase/client';

/**
 * Vérifie si l'utilisateur est authentifié avec une logique simplifiée
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Vérifier si l'utilisateur a une connexion réseau
    if (!navigator.onLine) {
      console.log("Réseau non disponible");
      return false;
    }
    
    // Récupérer la session directement
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Erreur lors de la vérification d'authentification:", error);
      return false;
    }
    
    if (!data || !data.session) {
      console.log("Aucune session trouvée");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception lors de la vérification d'authentification:", error);
    return false;
  }
};

/**
 * Fonction simplifiée pour vérifier l'authentification
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  return await verifyAuth();
};
