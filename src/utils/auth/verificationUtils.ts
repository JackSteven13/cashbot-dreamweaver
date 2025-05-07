
import { supabase, isProductionEnvironment, testSupabaseConnection } from '@/integrations/supabase/client';

/**
 * Vérifie si l'utilisateur est authentifié avec gestion d'erreur améliorée
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Début de la vérification d'authentification");
    
    // Tester la connectivité directe avec Supabase
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.log("Supabase n'est pas accessible, authentification impossible");
      return false;
    }
    
    // Détection de l'environnement
    const isProduction = isProductionEnvironment();
    
    // Tenter de récupérer la session avec un timeout court
    const timeoutPromise = new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error("Timeout")), 3000);
    });
    
    const sessionPromise = supabase.auth.getSession();
    
    try {
      const { data } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;
      
      if (!data || !data.session) {
        console.log("Aucune session trouvée via getSession");
        return false;
      }
      
      console.log("Session valide trouvée, utilisateur authentifié");
      return true;
    } catch (error) {
      console.error("Erreur ou timeout lors de la vérification:", error);
      
      // En cas d'erreur réseau, vérifier si un token existe
      const tokenKey = isProduction ? 'sb-auth-token-prod' : 'sb-cfjibduhagxiwqkiyhqd-auth-token';
      const hasToken = !!localStorage.getItem(tokenKey);
      
      if (hasToken) {
        console.log("Token local trouvé malgré l'erreur réseau");
        return true; // Considérer comme authentifié si un token existe
      }
      
      return false;
    }
  } catch (error) {
    console.error("Exception lors de la vérification d'authentification:", error);
    return false;
  }
};

/**
 * Version simplifiée de isUserAuthenticated
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  return await verifyAuth();
};
