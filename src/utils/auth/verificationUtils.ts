
import { supabase } from '@/integrations/supabase/client';

/**
 * Vérifie si l'utilisateur est authentifié - version ultra simplifiée et robuste
 * @returns Une promesse qui résout à un booléen indiquant si l'utilisateur est authentifié
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Début de la vérification d'authentification");
    
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
    
    // Vérifier si le jeton d'accès n'est pas expiré
    const now = Math.floor(Date.now() / 1000); // Timestamp actuel en secondes
    if (data.session.expires_at && data.session.expires_at < now) {
      console.log("Session expirée, tentative de rafraîchissement");
      
      try {
        const refreshResult = await supabase.auth.refreshSession();
        if (refreshResult.error || !refreshResult.data.session) {
          console.log("Échec du rafraîchissement de la session");
          return false;
        }
        console.log("Session rafraîchie avec succès");
      } catch (refreshError) {
        console.error("Erreur lors du rafraîchissement de la session:", refreshError);
        return false;
      }
    }
    
    // Test supplémentaire: essayer de récupérer le profil utilisateur pour confirmer que l'auth fonctionne
    try {
      const userId = data.session.user.id;
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.warn("Authentification validée mais accès au profil impossible:", profileError);
        // On ne considère pas ça comme une erreur bloquante
      }
    } catch (profileError) {
      console.warn("Erreur lors de la vérification du profil:", profileError);
      // Ne pas échouer si cette vérification supplémentaire échoue
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
