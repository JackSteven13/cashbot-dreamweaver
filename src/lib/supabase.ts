
import { createClient } from '@supabase/supabase-js';

// Configuration de base pour Supabase
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Création du client Supabase avec une configuration robuste
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage,
    detectSessionInUrl: false,
    flowType: 'implicit'
  },
  realtime: {
    timeout: 30000 // 30 seconds timeout for realtime connections
  },
  global: {
    headers: {
      'x-client-info': 'streamgenius-frontend'
    },
    fetch: (url, options) => {
      return fetch(url, { 
        ...options,
        cache: 'no-store',
        credentials: 'same-origin',
        // Add timeout to fetch requests
        signal: AbortSignal.timeout(15000) // 15 seconds timeout
      });
    }
  }
});

// Fonction pour nettoyer toutes les données d'authentification
export const clearStoredAuthData = () => {
  try {
    // Supprimer toutes les clés possibles liées à l'authentification
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-auth-token');
    localStorage.removeItem('sb-provider-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    localStorage.removeItem('sb-auth-event');
    localStorage.removeItem('sb-auth-session');
    localStorage.removeItem('supabase.auth.refreshToken');
    
    // Supprimer les clés spécifiques pour ce projet
    localStorage.removeItem('supabase.auth.event');
    localStorage.removeItem('supabase.auth.session');
    
    // Supprimer les clés d'email et d'autres données
    localStorage.removeItem('last_logged_in_email');
    localStorage.removeItem('current_auth_data');
    localStorage.removeItem('auth_checking');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_redirecting');
    localStorage.removeItem('auth_redirect_timestamp');
    localStorage.removeItem('auth_check_timestamp');
    localStorage.removeItem('data_syncing');
    
    // Rechercher et supprimer toutes les clés liées à Supabase
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-') || key.includes('auth_')) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Vérifier si nous sommes dans un environnement de production
export const isProductionEnvironment = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('streamgenius.io') || 
          window.location.hostname.includes('netlify.app') ||
          window.location.hostname.includes('hostinger'));
};

// Function pour tester la connexion à Supabase avec timeout et retry
export const testSupabaseConnection = async (retries = 2): Promise<boolean> => {
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        },
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 200) {
        return true;
      }
      
      console.warn(`Supabase health check failed (attempt ${attempt + 1}/${retries + 1}): ${response.status}`);
      attempt++;
      
      if (attempt <= retries) {
        // Wait with exponential backoff before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    } catch (error) {
      console.error(`Erreur lors du test de connexion à Supabase (tentative ${attempt + 1}/${retries + 1}):`, error);
      
      if (error.name === 'AbortError') {
        console.error("Délai d'attente dépassé lors de la connexion à Supabase");
      }
      
      attempt++;
      
      if (attempt <= retries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      } else {
        return false;
      }
    }
  }
  
  return false;
};

