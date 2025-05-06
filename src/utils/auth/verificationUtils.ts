
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';

/**
 * Vérification simplifiée de la connexion réseau
 */
const checkNetworkConnectivity = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    console.log("Le navigateur rapporte être hors ligne");
    return false;
  }
  
  try {
    // Utiliser l'URL de base de Supabase pour tester la connectivité
    const response = await fetch(`${SUPABASE_URL}`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification de connectivité:", error);
    return navigator.onLine;
  }
};

/**
 * Vérification d'authentification robuste
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Vérification d'authentification");
    
    // Vérifier la connectivité réseau
    const isNetworkAvailable = await checkNetworkConnectivity();
    if (!isNetworkAvailable) {
      console.log("Réseau non disponible");
      return false;
    }
    
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
