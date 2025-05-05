
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Configuration Supabase optimisée spécifiquement pour la production
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit', // Passage à implicit pour une meilleure compatibilité avec les redirections
      storage: localStorage
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': 'streamgenius-web'
      }
    }
  }
);

// Fonction de nettoyage complète pour les données d'authentification
export const clearStoredAuthData = () => {
  try {
    console.log("Nettoyage des données d'authentification");
    
    // Nettoyer localStorage - approche exhaustive
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('token')) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Erreur lors de la suppression de ${key}:`, e);
        }
      }
    });
    
    // Supprimer explicitement les clés connues
    const knownKeys = [
      'supabase.auth.token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'sb-access-token',
      'sb-refresh-token'
    ];
    
    knownKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.error(`Erreur lors de la suppression de la clé ${key}:`, e);
      }
    });
    
    // Nettoyer les cookies avec un ciblage explicite pour les domaines streamgenius.io
    document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.streamgenius.io';
    document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.streamgenius.io';
    document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
