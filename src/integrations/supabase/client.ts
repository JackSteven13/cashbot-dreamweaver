
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { clearAuthData as libClearAuthData } from '@/lib/supabase';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Instance singleton pour éviter les conflits
let supabaseInstance: SupabaseClient<Database> | null = null;

// Version améliorée pour détecter l'environnement
export const isProductionEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.includes('streamgenius.io') || 
         hostname.includes('netlify.app') || 
         !hostname.includes('localhost') && !hostname.includes('lovable');
};

// Configuration optimisée du client Supabase
const createSupabaseClient = (): SupabaseClient<Database> => {
  // Retourner l'instance existante si disponible
  if (supabaseInstance) return supabaseInstance;
  
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
    supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, options);
    return supabaseInstance;
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

// Fonction pour nettoyer les données d'authentification - utilise la fonction de la bibliothèque
export const clearStoredAuthData = () => {
  return libClearAuthData();
};

// Fonction pour forcer une réinitialisation de l'authentification
export const forceRetrySigning = async () => {
  console.log("Réinitialisation de l'authentification");
  
  // Nettoyage des données
  clearStoredAuthData();
  
  try {
    // Déconnexion explicite
    await supabase.auth.signOut({ scope: 'global' });
  } catch (e) {
    // Ignorer les erreurs
  }
  
  // Recréation d'une instance propre
  supabaseInstance = null;
  createSupabaseClient();
  
  return true;
};
