
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec URL et clé publique
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Client Supabase avec configuration simplifiée - plus fiable
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'sb-auth-token',
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-client-info': 'streamgenius-app' },
  },
});

// Fonction de nettoyage des données d'authentification simplifiée et robuste
export const clearStoredAuthData = () => {
  try {
    if (typeof window === 'undefined') return false;
    
    // Nettoyer localStorage de manière exhaustive
    const keysToRemove = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase.auth.token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'auth_redirecting',
      'auth_checking',
      'auth_refreshing',
      'auth_redirect_timestamp',
      'auth_check_timestamp',
      'data_syncing'
    ];
    
    // Suppression ciblée des clés connues
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Rechercher et supprimer toutes les clés liées à Supabase
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Nettoyage des cookies liés à Supabase
    document.cookie.split(';').forEach(cookie => {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie.startsWith('sb-') || trimmedCookie.startsWith('supabase-')) {
        const name = trimmedCookie.split('=')[0];
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Fonction pour vérifier la connexion internet
export const hasInternetConnection = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Fonction optimisée pour tester la disponibilité du service Supabase
export const testSupabaseConnection = async () => {
  try {
    // Utiliser une URL qui ne nécessite pas d'authentification
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn("Erreur lors du test de connexion à Supabase:", error);
    return false;
  }
};
