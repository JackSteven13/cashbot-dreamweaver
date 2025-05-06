
import { supabase } from '@/integrations/supabase/client';

/**
 * Récupère la session actuelle avec gestion d'erreur
 */
export const getCurrentSession = async () => {
  try {
    // Utiliser un timeout pour éviter les blocages
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Délai d'attente dépassé")), 5000);
    });
    
    const sessionPromise = supabase.auth.getSession();
    
    // Course entre la récupération de session et le timeout
    const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;
    
    return data?.session || null;
  } catch (error) {
    console.error("Erreur lors de la récupération de la session:", error);
    return null;
  }
};

/**
 * Rafraîchit la session actuelle
 */
export const refreshSession = async () => {
  try {
    console.log("Tentative de rafraîchissement de la session");
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Erreur lors du rafraîchissement de la session:", error);
      return null;
    }
    
    console.log("Session rafraîchie avec succès");
    return data?.session || null;
  } catch (error) {
    console.error("Exception lors du rafraîchissement de la session:", error);
    return null;
  }
};

/**
 * Déconnecte l'utilisateur de manière forcée
 */
export const forceSignOut = async () => {
  try {
    console.log("Déconnexion forcée");
    
    // Essai avec scope global d'abord
    await supabase.auth.signOut({ scope: 'global' });
    
    // Attendre un court délai
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Vérifier si la déconnexion a réussi
    const { data } = await supabase.auth.getSession();
    
    if (data?.session) {
      // Si la session existe toujours, essayer une déconnexion normale
      console.log("La session persiste, tentative supplémentaire");
      await supabase.auth.signOut();
      
      // Attendre un autre délai
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la déconnexion forcée:", error);
    return false;
  }
};
