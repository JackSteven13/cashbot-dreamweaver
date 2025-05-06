
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Create the Supabase client with explicit configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'implicit',
    debug: true
  },
  global: {
    // Move fetch configuration to global options
    fetch: (...args) => {
      const [url, options] = args;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
        keepalive: true,
        credentials: 'include',
        headers: {
          ...options?.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      }).finally(() => clearTimeout(timeoutId));
    }
  }
});

// Fonction pour nettoyer complètement les données d'authentification
export const clearAuthData = () => {
  try {
    // Supprimer la session actuelle de la mémoire de Supabase
    try {
      supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      // Ignorer les erreurs silencieusement
    }
    
    // Liste complète des clés potentielles liées à l'authentification
    const keysToRemove = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase.auth.token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'supabase.auth.expires_at',
      'supabase.auth.refresh_token',
      'supabase.auth.provider_token',
      'supabase.auth.tenant',
      'supabase.auth.session',
      'sb-provider-token',
      'sb-provider-refresh-token',
      'sn-csrf-cookie',
      'lesson-auth-cookie',
      'supabase.auth.event',
      'session_cookie_subs',
      'auth_refreshing',
      'auth_checking',
      'auth_redirecting'
    ];
    
    // Chercher dans localStorage pour toute clé contenant 'supabase', 'sb-' ou 'auth'
    Object.keys(localStorage).forEach(key => {
      if (
        key.includes('supabase') || 
        key.includes('sb-') || 
        key.includes('auth') ||
        key.includes('token')
      ) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignorer
        }
      }
    });
    
    // Ensuite supprimer explicitement nos clés connues
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(key);
        }
      } catch (e) {
        // Ignorer
      }
    });
    
    // Nettoyer tous les cookies liés à Supabase
    document.cookie.split(';').forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      if (
        cookieName.includes('sb-') || 
        cookieName.includes('supabase') || 
        cookieName.includes('auth') ||
        cookieName.includes('token')
      ) {
        try {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        } catch (e) {
          // Ignorer
        }
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// For backward compatibility
export { supabase as createClient };
