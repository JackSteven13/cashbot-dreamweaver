
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec URL et clé publique
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Client Supabase avec configuration optimisée
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'streamgenius-app'
    },
    fetch: (url: string, options: RequestInit = {}) => {
      // Configuration CORS améliorée
      const headers = {
        ...options.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      } as Record<string, string>;

      // Désactiver les caches qui peuvent causer des problèmes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes timeout (réduit de 30 à 15)

      const fetchPromise = fetch(url, {
        ...options,
        headers,
        // Ne pas utiliser de cache
        cache: 'no-store',
        credentials: 'include',
        signal: options.signal || controller.signal
      });

      // Nettoyer le timeout après la requête
      fetchPromise.finally(() => clearTimeout(timeoutId));
      
      return fetchPromise;
    }
  }
});

// Fonction de nettoyage radical des données d'authentification
export const clearStoredAuthData = () => {
  try {
    console.log("Nettoyage radical des données d'authentification");
    
    // Supprimer tous les tokens Supabase
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
    
    // Nettoyer les cookies liés à l'authentification - approche plus complète
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name && (name.includes('sb-') || name.includes('supabase'))) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}; secure; SameSite=None`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    // Force également la déconnexion via les événements de stockage
    try {
      window.sessionStorage.clear();
    } catch (e) {
      console.warn("Impossible d'accéder à sessionStorage:", e);
    }
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Fonction pour vérifier la connectivité au serveur Supabase
export const checkSupabaseConnectivity = async (retryCount = 0): Promise<boolean> => {
  try {
    if (retryCount > 3) {
      console.warn("Nombre maximum de tentatives de connexion atteint");
      return false;
    }
    
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout (réduit)
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'OPTIONS',  // Utilise OPTIONS qui est plus léger
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        credentials: 'omit', // Pas besoin de cookies pour ce test
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      
      // Si la requête prend trop de temps, considérer comme un problème de connectivité
      if (endTime - startTime > 3000) {
        console.warn("La connexion à Supabase est lente");
        return true; // On retourne quand même true pour ne pas bloquer
      }
      
      return response.ok || response.status === 204; // OPTIONS retourne généralement 204
    } catch (innerErr) {
      clearTimeout(timeoutId);
      console.error("Erreur lors du test de connectivité:", innerErr);
      
      // Tenter à nouveau avec un délai exponentiel
      if (retryCount < 3) {
        console.log(`Nouvelle tentative de connexion (${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount)));
        return await checkSupabaseConnectivity(retryCount + 1);
      }
      
      return false;
    }
  } catch (err) {
    console.error("Erreur de connectivité Supabase:", err);
    return false;
  }
};

// Fonction utilitaire pour détecter l'environnement
export const isProductionEnvironment = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('streamgenius.io') || 
          window.location.hostname.includes('streamgenius.netlify.app'));
};
