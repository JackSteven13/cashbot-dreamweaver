
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Version de base sans configuration complexe qui pourrait causer des erreurs
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // Désactiver cette option qui peut causer des problèmes sur streamgenius.io
    detectSessionInUrl: false,
    storage: localStorage,
    storageKey: 'supabase-auth-token'
  },
  global: {
    headers: {
      'X-Client-Info': 'streamgenius@1.0.0'
    },
  }
});

/**
 * Nettoie complètement toutes les données d'authentification
 * Version simplifiée sans trop de logique compliquée
 */
export const clearStoredAuthData = () => {
  try {
    // Nettoyer les jetons principaux uniquement
    localStorage.removeItem('supabase-auth-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    console.log("Nettoyage des données d'authentification effectué");
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

/**
 * Fonction utilitaire pour tester la connexion à Supabase
 * @returns true si la connexion est établie avec succès
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Test simple, sans options complexes
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error("Erreur de connexion à Supabase:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception lors du test de connexion à Supabase:", err);
    return false;
  }
};

/**
 * Récupère une session proprement
 * @returns La session si elle existe, null sinon
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
