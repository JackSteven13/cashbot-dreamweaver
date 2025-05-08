
import { supabase } from '@/integrations/supabase/client';

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
 * Vérifie si l'utilisateur est authentifié avec une gestion améliorée des erreurs de serveur
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // Vérifier d'abord la connectivité réseau
    const isNetworkAvailable = await checkNetworkConnectivity();
    if (!isNetworkAvailable) {
      console.log("Réseau non disponible");
      return false;
    }
    
    // Vérifier localStorage
    const storageKey = 'sb-cfjibduhagxiwqkiyhqd-auth-token';
    const hasLocalStorage = !!localStorage.getItem(storageKey);
    
    if (!hasLocalStorage) {
      console.log(`Aucun token trouvé dans localStorage`);
      return false;
    }
    
    // Récupérer la session avec un timeout et une gestion des erreurs améliorée
    try {
      // Utiliser un court timeout avec AbortController pour éviter les attentes infinies
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes max
      
      const { data, error } = await supabase.auth.getSession();
      
      clearTimeout(timeoutId);
      
      if (error) {
        // Vérifier spécifiquement les erreurs de connexion serveur
        if (error.message?.includes('Server closed') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('Network') ||
            error.message?.includes('ECONNREFUSED')) {
          console.error("Erreur de connexion au serveur Supabase:", error);
          return false;
        }
        
        console.error("Erreur lors de la vérification d'authentification:", error);
        return false;
      }
      
      if (!data || !data.session) {
        console.log("Aucune session trouvée");
        return false;
      }
      
      return true;
    } catch (error: any) {
      // Gestion spécifique des erreurs d'abandon et de connexion
      if (error.name === 'AbortError') {
        console.error("Délai d'attente dépassé lors de la vérification de session");
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        console.error("Problème de connexion au serveur Supabase:", error);
      } else {
        console.error("Exception lors de la vérification d'authentification:", error);
      }
      return false;
    }
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
