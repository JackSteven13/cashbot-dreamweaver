
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Créer un client Supabase avec des options simplifiées
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: localStorage
  }
});

// Fonction de nettoyage radical des données d'authentification
export const clearStoredAuthData = () => {
  try {
    console.log("Nettoyage complet des données d'authentification");
    
    // Supprimer tous les tokens possibles
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
    
    // Nettoyer les cookies liés à l'authentification
    document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Fonction utilitaire pour détecter l'environnement
export const isProductionEnvironment = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('streamgenius.io') || 
          window.location.hostname.includes('netlify.app'));
};
