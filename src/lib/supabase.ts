
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Instance de Supabase unique pour toute l'application
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

// Client Supabase avec configuration optimisée pour l'authentification
export const createClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'sb-auth-token',
      flowType: 'pkce'
    },
    global: {
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache'
      }
    }
  });
  
  return supabaseInstance;
};

// Fonction pour nettoyer complètement les données d'authentification
export const clearAuthData = () => {
  try {
    // Nettoyer toutes les clés potentielles liées à l'authentification
    const keysToRemove = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'supabase.auth.token'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage?.removeItem(key);
    });
    
    // Nettoyer tous les cookies d'authentification Supabase
    document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
