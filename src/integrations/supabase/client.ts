
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

const getCurrentHost = () => {
  if (typeof window === 'undefined') return '';
  
  // Extraction du hostname actuel
  const { hostname } = window.location;
  
  // Déterminer si nous sommes sur le domaine principal ou sur un sous-domaine/domaine de développement
  if (hostname.includes('streamgenius.io') || hostname === 'streamgenius.io') {
    return 'https://streamgenius.io';
  } else if (hostname.includes('localhost') || hostname === 'localhost') {
    return 'http://localhost:5173'; // Port standard de Vite
  }
  
  // Fallback pour tout autre environnement (comme lovable.dev)
  return window.location.origin;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'implicit',
  },
  // Options globales pour améliorer la résilience
  global: {
    fetch: function(url, options) {
      const fetchOptions = {
        ...options,
        mode: 'cors',
        cache: 'no-cache',
      };
      return fetch(url, fetchOptions);
    },
    headers: {
      'X-Client-Info': 'supabase-js-v2',
    },
  },
});

// Fonctions utilitaires pour l'authentification
export const clearStoredAuthData = () => {
  try {
    // Supprimer les éléments de stockage liés à l'authentification
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
    
    // Supprimer d'autres drapeaux qui pourraient bloquer l'authentification
    const loginBlockingFlags = [
      'auth_checking',
      'auth_refreshing',
      'auth_redirecting',
      'auth_check_timestamp',
      'auth_refresh_timestamp',
      'auth_redirect_timestamp',
      'auth_signing_out'
    ];
    
    loginBlockingFlags.forEach(flag => {
      localStorage.removeItem(flag);
    });
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
