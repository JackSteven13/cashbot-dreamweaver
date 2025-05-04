
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration ultra-simplifiée du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // IMPORTANT: désactivation totale de la détection d'URL pour éviter les problèmes
    detectSessionInUrl: false,
    // Garder la persistance et le rafraîchissement automatique
    persistSession: true,
    autoRefreshToken: true,
    // Stocker dans localStorage pour persistance
    storage: localStorage
  },
  global: {
    headers: {
      'X-Client-Info': 'streamgenius-web'
    }
  }
});

// Fonction améliorée pour nettoyer TOUS les tokens d'authentification
export const clearStoredAuthData = () => {
  try {
    // Nettoyage exhaustif de tous les tokens possibles
    
    // 1. Nettoyage des tokens standards
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    localStorage.removeItem('supabase-auth-token');
    
    // 2. Nettoyage des tokens alternatifs avec formats différents
    localStorage.removeItem('supabase.auth.refresh-token');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-provider-token');
    localStorage.removeItem('supabase-auth-refresh-token');
    localStorage.removeItem('supabase-auth-provider');
    
    // 3. Nettoyage des flags de processus Supabase
    localStorage.removeItem('auth_checking');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_redirecting');
    localStorage.removeItem('auth_refresh_timestamp');
    localStorage.removeItem('data_syncing');
    localStorage.removeItem('auth_redirect_timestamp');
    localStorage.removeItem('auth_check_timestamp');
    
    // 4. Nettoyer toute clé contenant des mots-clés d'authentification
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('token') || 
          key.includes('sb-') ||
          key.includes('session')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Supprimer toutes les clés identifiées
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
