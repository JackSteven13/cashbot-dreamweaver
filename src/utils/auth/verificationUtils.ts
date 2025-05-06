
import { supabase, SUPABASE_URL, isProductionEnvironment } from '@/integrations/supabase/client';

/**
 * Version simplifiée qui ne vérifie pas réellement la connectivité réseau
 */
const checkNetworkConnectivity = async (): Promise<boolean> => {
  return true;
};

/**
 * Vérification d'authentification simplifiée
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Vérification d'authentification");
    
    try {
      // Vérification directe de session avec timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      if (!data || !data.session) {
        console.log("Aucune session trouvée");
        return false;
      }
      
      console.log("Session valide trouvée");
      return true;
    } catch (err) {
      console.error("Erreur lors de la vérification:", err);
      return false;
    }
  } catch (error) {
    console.error("Exception lors de la vérification d'authentification:", error);
    return false;
  }
};

/**
 * Version simplifiée
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  return await verifyAuth();
};
