
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

// Configuration du client Supabase avec options optimisées
const createSupabaseClient = (): SupabaseClient<Database> => {
  console.log("[Supabase] Initialisation du client");
  
  // Options optimisées pour la fiabilité
  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce' as const,
      storage: localStorage,
      storageKey: 'sb-auth-token',
    },
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

// Instance unique du client Supabase
export const supabase = createSupabaseClient();

// Fonction améliorée pour nettoyer les données d'authentification
export const clearStoredAuthData = () => {
  try {
    console.log("Nettoyage des données d'authentification");
    
    // Nettoyer localStorage - approche complète
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || 
          key.includes('sb-') || 
          key.startsWith('sb') || 
          key.includes('auth') || 
          key.includes('token')) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignorer les erreurs
        }
      }
    });
    
    // Nettoyer sessionStorage si disponible
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('supabase') || 
            key.includes('sb-') || 
            key.startsWith('sb') || 
            key.includes('auth') || 
            key.includes('token')) {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            // Ignorer les erreurs
          }
        }
      });
    }
    
    // Nettoyer les cookies spécifiques à Supabase
    document.cookie.split(';').forEach(c => {
      if (c.includes('sb-') || c.includes('supabase') || c.includes('auth')) {
        const cookieName = c.split('=')[0].trim();
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage:", err);
    return false;
  }
};

// Fonction pour forcer une déconnexion complète
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
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
};
