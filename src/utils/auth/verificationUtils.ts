
import { supabase } from '@/integrations/supabase/client';

/**
 * Vérifie si l'utilisateur est authentifié - version ultra simplifiée
 * @returns Une promesse qui résout à un booléen indiquant si l'utilisateur est authentifié
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error("Erreur lors de la vérification d'authentification:", error);
    return false;
  }
};

export const isUserAuthenticated = async (): Promise<boolean> => {
  return await verifyAuth();
};
