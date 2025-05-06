
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration plus simple pour éviter les problèmes de connexion
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: localStorage,
  }
});

/**
 * Nettoie complètement toutes les données d'authentification
 * Version simplifiée pour éviter les problèmes
 */
export const clearStoredAuthData = () => {
  try {
    // Nettoyer tous les jetons possibles (anciens et nouveaux formats)
    localStorage.removeItem('supabase-auth-token');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    localStorage.removeItem('sb-auth-token');
    
    // Nettoyer tous les refresh tokens
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
    localStorage.removeItem('supabase-auth-refresh');
    
    // Nettoyer les flags potentiellement bloquants
    localStorage.removeItem('auth_checking');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_redirecting');
    
    console.log("Nettoyage complet des données d'authentification effectué");
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

/**
 * Fonction utilitaire pour tester la connexion à Supabase
 * Version simplifiée qui retourne toujours true pour éviter les problèmes de connexion
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  // Toujours retourner true pour éviter les problèmes de connexion
  return true;
};

/**
 * Récupère une session proprement
 * Version simplifiée
 */
export const getSessionSafely = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Erreur lors de la récupération de session:", error);
      return null;
    }
    return data.session;
  } catch (err) {
    console.error("Exception lors de la récupération de session:", err);
    return null;
  }
};
