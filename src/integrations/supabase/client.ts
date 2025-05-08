
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec URL et clé publique
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration simplifiée du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'Cache-Control': 'no-store' },
  }
});

// Fonction simplifiée de nettoyage des données d'authentification
export const clearStoredAuthData = () => {
  try {
    if (typeof window === 'undefined') return;
    
    // Nettoyer localStorage
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-auth-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    // Rechercher et supprimer toutes les clés liées à Supabase
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Fonction pour vérifier l'état de la connexion
export const hasInternetConnection = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};
