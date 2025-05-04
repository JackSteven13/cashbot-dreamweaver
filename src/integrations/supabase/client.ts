
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration simplifiée du client Supabase avec options standard pour la compatibilité TypeScript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Désactiver la détection d'URL pour éviter les problèmes
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
    // Options pour le stockage
    storageKey: 'sb-auth-token',
    storage: localStorage
  },
  global: {
    // Headers personnalisés pour améliorer la compatibilité
    headers: {
      'X-Client-Info': 'streamgenius-web',
      'Origin': 'https://streamgenius.io',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    }
  },
  // Configuration réseau pour les problèmes de connectivité
  realtime: {
    timeout: 60000,
    params: {
      eventsPerSecond: 10
    }
  }
});

// Fonction pour nettoyer TOUS les tokens d'authentification
export const clearStoredAuthData = () => {
  try {
    // Nettoyage de tous les tokens possibles
    
    // 1. Nettoyer le localStorage complet de tous les tokens possibles de Supabase
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('token') || 
          key.includes('sb-') ||
          key.includes('session') ||
          key.includes('refresh')
      )) {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
      }
    }
    
    // 2. Nettoyer spécifiquement les clés connues de Supabase
    const knownKeys = [
      'supabase.auth.token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'supabase-auth-token',
      'sb-auth-token',
      'supabase.auth.refresh-token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-provider-token',
      'supabase-auth-refresh-token',
      'supabase-auth-provider',
      'auth_checking',
      'auth_refreshing',
      'auth_redirecting',
      'auth_refresh_timestamp',
      'data_syncing',
      'auth_redirect_timestamp',
      'auth_check_timestamp',
    ];
    
    knownKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    });
    
    // 3. Nettoyer le sessionStorage aussi
    knownKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {}
    });
    
    // 4. Nettoyer les cookies liés à l'authentification
    document.cookie.split(';').forEach(c => {
      const cookieName = c.trim().split('=')[0];
      if (cookieName && (cookieName.includes('sb-') || cookieName.includes('supabase') || cookieName.includes('auth'))) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });
    
    console.log("Nettoyage complet des données d'authentification effectué");
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
