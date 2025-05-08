
import { supabase, testSupabaseConnection } from '@/integrations/supabase/client';

/**
 * Vérifie si l'utilisateur est authentifié avec une logique simplifiée et fiable
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Vérifier si l'utilisateur a une connexion réseau
    if (!navigator.onLine) {
      console.log("Réseau non disponible");
      return false;
    }
    
    // Vérifier localStorage pour éviter des appels API inutiles
    const storageKey = 'sb-auth-token';
    const hasLocalStorage = !!localStorage.getItem(storageKey);
    
    if (!hasLocalStorage) {
      console.log(`Aucun token trouvé dans localStorage`);
      return false;
    }
    
    // Récupérer la session avec un délai limité
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // Cette méthode va tenter de récupérer la session et rafraîchir le token si nécessaire
      const { data, error } = await supabase.auth.getSession();
      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Erreur lors de la vérification d'authentification:", error);
        return false;
      }
      
      if (!data || !data.session) {
        console.log("Aucune session trouvée");
        return false;
      }
      
      return true;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Exception lors de l'appel à getSession:", fetchError);
      return false;
    }
  } catch (error) {
    console.error("Exception générale lors de la vérification d'authentification:", error);
    return false;
  }
};

/**
 * Fonction simplifiée pour vérifier l'authentification
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  return await verifyAuth();
};
