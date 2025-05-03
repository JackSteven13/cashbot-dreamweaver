
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration complètement révisée pour une meilleure compatibilité multi-domaines
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Désactiver pour éviter les problèmes de détection
    storage: localStorage,
    storageKey: 'supabase-auth-token', // Clé unifiée pour tous les domaines
    flowType: 'pkce', // PKCE pour sécurité renforcée
  },
  global: {
    headers: {
      'X-Client-Info': 'streamgenius@1.0.0',
    },
  },
  // Retry logic for network issues
  persistSession: true,
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

/**
 * Nettoie complètement toutes les données d'authentification
 * Version robuste qui résout les problèmes de connexion multi-domaines
 */
export const clearStoredAuthData = () => {
  try {
    // Nettoyer tous les jetons possibles (anciens et nouveaux formats)
    localStorage.removeItem('supabase-auth-token');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    localStorage.removeItem('sb-auth-token');
    
    // Nettoyer tous les refresh tokens
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
    localStorage.removeItem('supabase-auth-refresh');
    
    // Nettoyer d'autres flags et métadonnées
    const allKeys = Object.keys(localStorage);
    const authKeys = allKeys.filter(key => 
      key.includes('auth') || 
      key.includes('supabase') || 
      key.includes('sb-') || 
      key.includes('token')
    );
    
    authKeys.forEach(key => localStorage.removeItem(key));
    
    // Nettoyer les cookies qui pourraient interférer
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
