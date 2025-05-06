
import { supabase, clearStoredAuthData } from '@/integrations/supabase/client';

interface FallbackAuthResult {
  success: boolean;
  message: string;
}

// Fonction pour se connecter avec un mécanisme de secours
export const fallbackAuthenticate = async (email: string, password: string): Promise<FallbackAuthResult> => {
  try {
    // Nettoyer d'abord toutes les données d'authentification
    clearStoredAuthData();
    
    // Tenter une connexion directe
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error("Erreur d'authentification de secours:", error);
      return {
        success: false,
        message: error.message || "Échec de l'authentification de secours"
      };
    }
    
    return {
      success: true,
      message: "Authentification de secours réussie"
    };
  } catch (err) {
    console.error("Exception lors de l'authentification de secours:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Erreur inconnue lors de l'authentification de secours"
    };
  }
};

// Fonction pour rafraîchir explicitement la session
export const forcedSessionRefresh = async (): Promise<FallbackAuthResult> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error("Erreur lors du rafraîchissement forcé de la session:", error);
      return {
        success: false,
        message: error?.message || "Échec du rafraîchissement de la session"
      };
    }
    
    return {
      success: true,
      message: "Session rafraîchie avec succès"
    };
  } catch (err) {
    console.error("Exception lors du rafraîchissement forcé de la session:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Erreur inconnue lors du rafraîchissement de la session"
    };
  }
};
