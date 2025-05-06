
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Garantir une seule instance du client Supabase
let supabaseInstance = null;

// Créer un client Supabase avec des options minimales mais robustes
export const createClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: localStorage
    }
  });
  
  return supabaseInstance;
};

// Fonction pour nettoyer complètement les données d'authentification
export const clearAuthData = () => {
  try {
    // Liste complète des clés potentielles liées à l'authentification
    const keysToRemove = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase.auth.token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'supabase.auth.expires_at'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    });
    
    // Nettoyer tous les cookies liés à Supabase
    document.cookie.split(';').forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      if (cookieName.includes('sb-') || cookieName.includes('supabase')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
