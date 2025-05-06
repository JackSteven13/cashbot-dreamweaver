
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Fonction simplifiée pour détecter l'environnement
export const isProductionEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.includes('streamgenius.io') || 
         hostname.includes('netlify.app') || 
         !hostname.includes('localhost');
};

// Configuration du client Supabase avec options améliorées pour la fiabilité
const createSupabaseClient = (): SupabaseClient<Database> => {
  console.log(`[Supabase] Initialisation du client (${isProductionEnvironment() ? "PROD" : "DEV"})`);
  
  // Options optimisées pour tous les environnements
  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce' as const,
      storage: localStorage,
      storageKey: 'sb-auth-token',
      debug: true
    },
    global: {
      headers: {
        'Cache-Control': 'no-store',
        'X-Client-Info': 'streamgenius-webapp'
      },
      fetch: customFetch
    },
    // Délais d'attente plus longs pour les réseaux mobiles
    realtime: {
      timeout: 30000  // 30 secondes
    }
  };

  try {
    const client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, options);
    console.log("[Supabase] Client créé avec succès");
    return client;
  } catch (error) {
    console.error("[Supabase] Erreur lors de la création du client:", error);
    // Fallback avec options minimales
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: localStorage
      }
    });
  }
};

// Wrapper pour fetch avec timeout
const customFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const timeout = 20000; // 20 secondes de timeout
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(input, {
    ...init,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Instance unique du client Supabase
export const supabase = createSupabaseClient();

// Fonction améliorée pour nettoyer les données d'authentification
export const clearStoredAuthData = () => {
  try {
    console.log("Nettoyage des données d'authentification");
    
    // Nettoyer localStorage
    const keysToRemove = [
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'sb-auth-token-prod',
      'sb-auth-token-dev',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'auth_retries'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignorer les erreurs
      }
    });
    
    // Nettoyer les cookies potentiels (cross-browser)
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    
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
    // Déconnexion explicite avec scope global
    await supabase.auth.signOut({ scope: 'global' });
  } catch (e) {
    // Ignorer les erreurs
  }
  
  // Attendre un court délai
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return true;
};
