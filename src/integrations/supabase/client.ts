
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec URL et clé publique
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Simple utility to check if we're in production environment
export const isProductionEnvironment = () => {
  // Check if we're running in a production environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Consider it production if not localhost, 127.0.0.1 or a direct IP
    return !['localhost', '127.0.0.1'].includes(hostname) && 
           !/^192\.168\./.test(hostname) && 
           !/^10\./.test(hostname);
  }
  return false;
};

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
      // Configuration avec timeout plus long pour les environnements instables
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes
      
      const customFetch = async (attempt = 1, maxAttempts = 3) => {
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              ...options?.headers,
              'Cache-Control': 'no-cache, no-store'
            }
          });
          
          return response;
        } catch (error: any) {
          // Si ce n'est pas une erreur d'abandon volontaire et qu'on n'a pas dépassé le nombre de tentatives
          if (error.name !== 'AbortError' && attempt < maxAttempts) {
            console.log(`Tentative de reconnexion (${attempt}/${maxAttempts})...`);
            // Attendre un peu avant de réessayer (backoff exponentiel)
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 8000)));
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
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Fonction pour tester la connexion à Supabase
export const testSupabaseConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // Utilisation d'un endpoint simple pour vérifier la connexion
    const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
      method: 'HEAD', // HEAD request est plus léger qu'un GET
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Cache-Control': 'no-cache, no-store'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Erreur lors du test de connexion à Supabase:", error);
    return false;
  }
};

// Fonction pour vérifier et rafraîchir un token si nécessaire
export const checkAndRefreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Erreur lors de la récupération de la session:", error);
      return false;
    }
    
    if (!data.session) {
      console.log("Pas de session active");
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception lors de la vérification de la session:", err);
    return false;
  }
};
