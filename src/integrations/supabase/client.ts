
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Configuration complète du client Supabase avec options explicites pour éviter les problèmes de déploiement
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'implicit',
      storage: localStorage
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': 'streamgenius-app'
      }
    }
  }
);

// Fonction de nettoyage encore plus robuste pour éliminer complètement les données d'authentification
export const clearStoredAuthData = () => {
  try {
    console.log("Nettoyage des données d'authentification");
    
    // Nettoyer localStorage - approche exhaustive pour tous les navigateurs
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('token')) {
        try {
          localStorage.removeItem(key);
          console.log(`Supprimé du localStorage: ${key}`);
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
        console.error(`Erreur lors de la suppression de la clé spécifique ${key}:`, e);
      }
    });
    
    // Nettoyer les cookies liés à l'authentification - domaines multiples
    try {
      const domains = ['', '.streamgenius.io', '.lovable.dev'];
      const cookiePrefixes = ['sb-', 'supabase', 'access', 'refresh'];
      
      domains.forEach(domain => {
        document.cookie.split(";").forEach(c => {
          const cookieName = c.split("=")[0].trim();
          if (cookiePrefixes.some(prefix => cookieName.includes(prefix))) {
            const domainPart = domain ? `; domain=${domain}` : '';
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${domainPart}`;
            console.log(`Cookie supprimé: ${cookieName}${domain ? ` (domaine: ${domain})` : ''}`);
          }
        });
      });
    } catch (cookieError) {
      console.error("Erreur lors du nettoyage des cookies:", cookieError);
    }
    
    // Nettoyer sessionStorage également
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-') || key.includes('auth') || key.includes('token')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (sessionError) {
      console.error("Erreur lors du nettoyage de sessionStorage:", sessionError);
    }
    
    return true;
  } catch (err) {
    console.error("Erreur globale lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
