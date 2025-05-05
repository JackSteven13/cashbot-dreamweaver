
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Configuration optimisée pour les connexions directes
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Désactivé pour contourner les problèmes de redirection
    storage: localStorage,
    flowType: 'implicit',
  }
});

/**
 * Fonction radicale de nettoyage de toutes les données d'authentification
 * Optimisée pour résoudre les problèmes de connexion persistants
 */
export const clearStoredAuthData = () => {
  try {
    console.log("🧹 Nettoyage radical des données d'authentification");
    
    // Nettoyer toutes les clés localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
          key.includes('sb-') || 
          key.includes('supabase') || 
          key.includes('auth.') ||
          key.includes('auth_')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Échec de suppression de ${key}`, e);
      }
    });
    
    // Nettoyer sessionStorage aussi
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
          key.includes('sb-') || 
          key.includes('supabase') || 
          key.includes('auth.')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`Échec de suppression de ${key} dans sessionStorage`, e);
      }
    });
    
    // Suppression complète des cookies liés à l'authentification
    document.cookie.split(';').forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      if (cookieName.includes('sb-') || cookieName.includes('supabase')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erreur critique lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
