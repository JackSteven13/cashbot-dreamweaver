
import { supabase, isProductionEnvironment } from '@/integrations/supabase/client';

/**
 * Vérifie si l'utilisateur est authentifié - version optimisée pour production
 * @returns Une promesse qui résout à un booléen indiquant si l'utilisateur est authentifié
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Début de la vérification d'authentification");
    
    // Détection de l'environnement pour adapter la vérification
    const isProduction = isProductionEnvironment();
    console.log(`Vérification d'auth en ${isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT'}`);
    
    // Vérifier d'abord localStorage - clé adaptée selon l'environnement
    const storageKey = isProduction ? 'sb-auth-token-prod' : 'sb-cfjibduhagxiwqkiyhqd-auth-token';
    const hasLocalStorage = !!localStorage.getItem(storageKey);
    
    if (!hasLocalStorage) {
      console.log(`Aucun token trouvé dans localStorage (${storageKey})`);
      return false;
    }
    
    // Vérification des cookies si en production
    if (isProduction) {
      const cookies = document.cookie;
      const hasCookieToken = cookies.includes('sb-') || cookies.includes('token');
      
      if (!hasCookieToken) {
        console.log("Aucun cookie d'authentification trouvé en production");
        // On continue tout de même la vérification car les cookies peuvent être bloqués
      }
    }
    
    // Utiliser getSession avec options explicites
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
    
    // En production, faire une vérification supplémentaire avec un appel API réel
    if (isProduction) {
      console.log("Environnement de production détecté, vérification supplémentaire avec API");
      
      try {
        // Vérification directe avec un appel à la table profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileError) {
          console.warn("Erreur lors de la vérification du profil:", profileError);
          
          // En production, une erreur d'accès aux données est critique
          if (isProduction && profileError.message.includes('JWT')) {
            console.error("Problème de JWT détecté, authentification invalide");
            return false;
          }
        }
      } catch (e) {
        console.warn("Exception lors de la vérification du profil:", e);
        // On continue tout de même
      }
    }
    
    // Session validée avec toutes les vérifications
    console.log("Session valide confirmée pour:", data.session.user.email);
    
    // Stocker des indicateurs permettant de détecter des problèmes de synchro
    try {
      localStorage.setItem('last_auth_check', new Date().toISOString());
      localStorage.setItem('auth_user_id', data.session.user.id);
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des indicateurs d'auth:", e);
    }
    
    return true;
  } catch (error) {
    console.error("Exception lors de la vérification d'authentification:", error);
    return false;
  }
};

/**
 * Version plus robuste de isUserAuthenticated avec adaptation production/dev
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  // Implémentation directe pour éviter les redirections circulaires
  return await verifyAuth();
};

