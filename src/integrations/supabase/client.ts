
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec URL et clé publique
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration optimisée et plus robuste du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined
  },
  global: {
    fetch: (url, options) => {
      // Configuration avec timeout plus court
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes
      
      const customFetch = async (attempt = 1, maxAttempts = 2) => {
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              ...options?.headers,
            }
          });
          
          return response;
        } catch (error: any) {
          // Si ce n'est pas une erreur d'abandon volontaire et qu'on n'a pas dépassé le nombre de tentatives
          if (error.name !== 'AbortError' && attempt < maxAttempts) {
            console.log(`Tentative de reconnexion (${attempt}/${maxAttempts})...`);
            // Attendre un peu avant de réessayer (backoff linéaire simple)
            await new Promise(resolve => setTimeout(resolve, 1000));
            return customFetch(attempt + 1, maxAttempts);
          }
          throw error;
        }
      };
      
      return customFetch().finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }
});

// Fonction améliorée de nettoyage des données d'authentification
export const clearStoredAuthData = () => {
  try {
    console.log("Nettoyage des données d'authentification");
    
    // Supprimer tous les tokens Supabase
    if (typeof window === 'undefined') return true;
    
    // Nettoyer localStorage
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-auth-token');
    
    // Supprimer la clé spécifique pour ce projet
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    // Rechercher et supprimer toutes les clés liées à Supabase
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Nettoyer également sessionStorage
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('supabase.') || key.startsWith('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Impossible de nettoyer sessionStorage:", e);
    }
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Fonction utilitaire pour vérifier la connexion internet
export const hasInternetConnection = () => {
  return navigator.onLine;
};

// Fonction pour tester la connexion à Supabase
export const testSupabaseConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Erreur lors du test de connexion à Supabase:", error);
    return false;
  }
};
