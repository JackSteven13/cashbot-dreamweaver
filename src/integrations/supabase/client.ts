
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Client Supabase avec configuration simplifiée pour maximiser la stabilité
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'supabase-auth-token',
      storage: localStorage,
      detectSessionInUrl: false,
      flowType: 'implicit'
    }
  }
);

// Fonction radicale de nettoyage, garantissant qu'aucune donnée d'authentification ne subsiste
export const clearStoredAuthData = () => {
  try {
    console.log("🔥 Nettoyage RADICAL des données d'authentification");
    
    // 1. Nettoyer TOUT le localStorage lié à l'auth
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
          key.includes('sb-') || 
          key.includes('supabase') || 
          key.includes('auth') ||
          key.includes('token')
      )) {
        try {
          console.log(`Suppression de: ${key}`);
          localStorage.removeItem(key);
        } catch (e) {}
      }
    }
    
    // 2. Nettoyer TOUT le sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
          key.includes('sb-') || 
          key.includes('supabase') || 
          key.includes('auth')
      )) {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {}
      }
    }
    
    // 3. Éliminer TOUS les cookies pertinents
    document.cookie.split(';').forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      if (cookieName.includes('sb-') || cookieName.includes('supabase')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.streamgenius.io; secure; samesite=strict`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=strict`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
    
    // 4. Forcer la suppression spécifique des clés problématiques
    const specificKeys = [
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'sb-cfjibduhagxiwqkiyhqd-auth-refresh',
      'supabase-auth-token',
      'supabase.auth.token',
      'auth.token'
    ];
    
    specificKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {}
    });
    
    return true;
  } catch (err) {
    console.error("Erreur critique lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
