
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
 * Vérification d'authentification robuste avec réessai intégré
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
    
    // Premier essai direct pour vérifier la session
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Erreur lors de la vérification de session:", sessionError);
        // Continue à la tentative de rafraîchissement
      } else if (sessionData?.session?.user?.id) {
        console.log("Session valide trouvée directement");
        return true;
      }
    } catch (err) {
      console.error("Exception lors de la première vérification:", err);
      // Continue à la tentative de rafraîchissement
    }
    
    // Deuxième essai - tenter de rafraîchir la session
    try {
      console.log("Tentative de rafraîchissement de la session");
      const { data: refreshData } = await supabase.auth.refreshSession();
      
      if (refreshData?.session?.user?.id) {
        console.log("Session rafraîchie avec succès");
        return true;
      }
    } catch (refreshErr) {
      console.error("Erreur lors du rafraîchissement:", refreshErr);
    }
    
    // Troisième essai - vérifier à nouveau la session après une courte pause
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const { data: finalCheck } = await supabase.auth.getSession();
      
      if (finalCheck?.session?.user?.id) {
        console.log("Session valide trouvée après rafraîchissement");
        return true;
      }
      
      console.log("Aucune session valide trouvée après tous les essais");
      return false;
    } catch (finalErr) {
      console.error("Exception lors de la vérification finale:", finalErr);
      return false;
    }
  } catch (error) {
    console.error("Exception générale lors de la vérification d'authentification:", error);
    return false;
  }
};

/**
 * Version simplifiée pour les vérifications rapides
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  return await verifyAuth();
};
