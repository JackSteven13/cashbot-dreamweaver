
import { supabase, testSupabaseConnection } from '@/integrations/supabase/client';

/**
 * Vérifie si l'utilisateur est authentifié avec une logique plus fiable
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Vérifier si l'utilisateur a une connexion réseau
    if (!navigator.onLine) {
      console.log("Réseau non disponible");
      return false;
    }
    
    // Vérifier localStorage pour éviter des appels API inutiles
    const storageKey = 'sb-cfjibduhagxiwqkiyhqd-auth-token';
    const hasLocalStorage = !!localStorage.getItem(storageKey);
    
    if (!hasLocalStorage) {
      console.log(`Aucun token trouvé dans localStorage`);
      return false;
    }
    
    // Test rapide de disponibilité de Supabase
    const isSupabaseAvailable = await testSupabaseConnection();
    if (!isSupabaseAvailable) {
      console.error("Service Supabase indisponible");
      return false;
    }
    
    // Récupérer la session avec un délai limité
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Erreur lors de la vérification d'authentification:", error);
        // Détection spécifique de l'erreur "Server closed"
        if (error.message?.includes('Server closed') || error.message?.includes('Connection') || error.message?.includes('network')) {
          console.log("Problème de connexion au serveur détecté");
          return false;
        }
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

/**
 * Vérifie l'authentification avec réessais
 */
export const verifyAuthWithRetry = async (maxRetries = 2): Promise<boolean> => {
  let retries = 0;
  let isAuth = false;
  
  while (retries <= maxRetries && !isAuth) {
    isAuth = await verifyAuth();
    if (isAuth) break;
    
    // Backoff exponentiel pour les réessais
    const delay = Math.min(1000 * Math.pow(2, retries), 5000);
    console.log(`Authentification échouée, nouvelle tentative dans ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    retries++;
  }
  
  return isAuth;
};
