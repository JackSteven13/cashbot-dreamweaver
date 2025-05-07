
import { supabase, isProductionEnvironment } from '@/integrations/supabase/client';

/**
 * Vérifier la connectivité réseau et l'accès à Supabase
 */
const checkNetworkConnectivity = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    console.log("Le navigateur rapporte être hors ligne");
    return false;
  }
  
  // Version simplifiée qui vérifie uniquement l'état en ligne du navigateur
  return navigator.onLine;
};

/**
 * Vérifie si l'utilisateur est authentifié
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Vérifier d'abord la connectivité réseau
    const isNetworkAvailable = await checkNetworkConnectivity();
    if (!isNetworkAvailable) {
      console.log("Réseau non disponible");
      return false;
    }
    
    // Détection de l'environnement
    const isProduction = isProductionEnvironment();
    
    // Vérifier localStorage
    const storageKey = 'sb-cfjibduhagxiwqkiyhqd-auth-token';
    const hasLocalStorage = !!localStorage.getItem(storageKey);
    
    if (!hasLocalStorage) {
      console.log(`Aucun token trouvé dans localStorage`);
      return false;
    }
    
    // Récupérer la session avec un timeout court
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
