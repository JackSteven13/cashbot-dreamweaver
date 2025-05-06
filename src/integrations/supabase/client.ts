
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Version améliorée pour détecter l'environnement en se basant sur l'URL
export const isProductionEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.includes('streamgenius.io') || 
         hostname.includes('netlify.app') || 
         !hostname.includes('localhost') && !hostname.includes('lovable');
};

// Configuration du client Supabase avec options optimisées pour tous les environnements
const createSupabaseClient = (): SupabaseClient<Database> => {
  console.log(`[Supabase] Initialisation du client (${isProductionEnvironment() ? "PROD" : "DEV"})`);
  
  // Options universelles pour garantir une connexion fiable partout
  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce' as const,
      storage: localStorage,
      storageKey: 'sb-auth-token',
      cookieOptions: {
        secure: true,
        sameSite: 'lax' as const,
        path: '/'
      }
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
    // Fallback avec options minimales en cas d'erreur
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
};

// Instance unique du client Supabase
export const supabase = createSupabaseClient();

// Fonction améliorée pour nettoyer les données d'authentification
export const clearStoredAuthData = () => {
  try {
    // Liste complète des clés possibles à nettoyer
    const keysToRemove = [
      // Clés standard
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      // Clés spécifiques
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'auth_retries',
      'sb-auth-token-prod',
      'sb-auth-token-dev'
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
    const cookieNames = ['sb-access-token', 'sb-refresh-token'];
    const domains = ['', '.streamgenius.io', 'streamgenius.io'];
    const paths = ['/', '/auth', '/login'];
    
    cookieNames.forEach(name => {
      domains.forEach(domain => {
        paths.forEach(path => {
          const domainPart = domain ? `domain=${domain};` : '';
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; ${domainPart}`;
        });
      });
    });
    
    console.log("Nettoyage des données d'authentification effectué");
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage:", err);
    return false;
  }
};

// Fonction améliorée pour forcer une réinitialisation de l'authentification
export const forceRetrySigning = async () => {
  console.log("Réinitialisation complète de l'authentification");
  
  // Nettoyage des données
  clearStoredAuthData();
  
  try {
    // Déconnexion explicite
    await supabase.auth.signOut({ scope: 'global' });
  } catch (e) {
    // Ignorer les erreurs
  }
  
  // Attendre un court délai
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return true;
};
