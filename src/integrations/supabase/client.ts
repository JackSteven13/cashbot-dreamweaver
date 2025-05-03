
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration optimisée et robuste pour fonctionner sur tous les domaines
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important: désactiver pour éviter les conflits de détection
    storage: localStorage,
    storageKey: 'sb-auth-token', // Clé unifiée pour tous les domaines
    flowType: 'pkce', // Plus sécurisé et compatible avec les domaines multiples
  },
  global: {
    headers: {
      'X-Client-Info': 'streamgenius@1.0.0',
    },
  },
});

/**
 * Nettoie complètement toutes les données d'authentification
 * Version améliorée pour résoudre les problèmes de connexion multi-domaines
 */
export const clearStoredAuthData = () => {
  try {
    // Nettoyer tous les jetons d'authentification possibles
    localStorage.removeItem('sb-auth-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
    
    // Supprimer toutes les métadonnées et flags d'authentification
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('auth_') || 
      key.startsWith('sb-') || 
      key.includes('supabase') ||
      key.includes('token') ||
      key.includes('session')
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Nettoyer également les cookies qui pourraient interférer
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name.includes('sb-') || name.includes('supabase')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.streamgenius.io`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
    
    console.log("Nettoyage complet des données d'authentification effectué");
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
