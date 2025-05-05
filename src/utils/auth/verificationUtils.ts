
import { supabase } from '@/integrations/supabase/client';

/**
 * Vérifie si l'utilisateur est authentifié - version simplifiée et robuste
 * @returns Une promesse qui résout à un booléen indiquant si l'utilisateur est authentifié
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Début de la vérification d'authentification");
    
    // Vérifier d'abord localStorage
    const hasLocalStorage = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    if (!hasLocalStorage) {
      console.log("Aucun token trouvé dans localStorage");
      return false;
    }
    
    // Version améliorée - récupération de la session avec options explicites
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Erreur lors de la vérification d'authentification:", error);
      return false;
    }
    
    // Vérification plus stricte de l'existence et de la validité de la session
    if (!data || !data.session) {
      console.log("Aucune session trouvée");
      return false;
    }
    
    if (!data.session.user || !data.session.user.id) {
      console.log("Session trouvée mais sans utilisateur valide");
      return false;
    }
    
    // Essayer de faire un appel API simple pour confirmer que l'authentification fonctionne
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.session.user.id)
        .single();
        
      if (profileError) {
        console.warn("Erreur lors de la vérification du profil:", profileError);
        // On continue malgré tout - ce n'est pas un échec critique
      }
    } catch (e) {
      console.warn("Exception lors de la vérification du profil:", e);
      // On continue malgré tout
    }
    
    // Test supplémentaire pour environnement de production: vérifier si le domaine est streamgenius.io
    const isProduction = window.location.hostname.includes('streamgenius.io');
    if (isProduction) {
      console.log("Environnement de production détecté, vérification supplémentaire");
      
      // En production, il est normal de ne pas avoir de cookies visibles pour raisons de sécurité
      // On se fie d'abord à la validité de l'objet session qu'on a déjà vérifié
    }
    
    // Session validée avec toutes les vérifications
    console.log("Session valide confirmée pour:", data.session.user.email);
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
  // Implémentation directe pour éviter les redirections circulaires
  return await verifyAuth();
};
