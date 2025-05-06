
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Version améliorée pour détecter l'environnement
export const isProductionEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.includes('streamgenius.io') || 
         hostname.includes('netlify.app') || 
         !hostname.includes('localhost') && !hostname.includes('lovable');
};

// Configuration du client Supabase
const createSupabaseClient = (): SupabaseClient<Database> => {
  console.log(`[Supabase] Initialisation du client (${isProductionEnvironment() ? "PROD" : "DEV"})`);
  
  // Options universelles pour garantir une connexion fiable
  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce' as const,
      storage: localStorage,
      storageKey: 'sb-auth-token'
    },
    global: {
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache'
      }
    }
  };

  try {
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, options);
  } catch (error) {
    console.error("[Supabase] Erreur lors de la création du client:", error);
    // Fallback avec options minimales
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
};

// Instance unique du client Supabase
export const supabase = createSupabaseClient();

// Fonction pour nettoyer les données d'authentification
export const clearStoredAuthData = () => {
  try {
    // Liste complète des clés à nettoyer
    const keysToRemove = [
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(key);
        }
      } catch (e) {
        // Ignorer les erreurs individuelles
      }
    });
    
    // Nettoyer tous les cookies liés à l'authentification
    document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    console.log("Nettoyage des données d'authentification effectué");
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage:", err);
    return false;
  }
};

// Fonction pour forcer une réinitialisation de l'authentification
export const forceRetrySigning = async () => {
  console.log("Réinitialisation de l'authentification");
  
  // Nettoyage des données
  clearStoredAuthData();
  
  try {
    // Déconnexion explicite
    await supabase.auth.signOut();
  } catch (e) {
    // Ignorer les erreurs
  }
  
  return true;
};
