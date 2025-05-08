
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec URL et clé publique
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Fonction pour détecter si nous sommes sur le domaine personnalisé
function isCustomDomain() {
  return typeof window !== 'undefined' && 
         window.location.hostname.includes('streamgenius.io');
}

// Client Supabase avec configuration optimisée pour le domaine personnalisé
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Custom-Domain': isCustomDomain() ? 'streamgenius.io' : undefined,
    },
  },
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
    
    // Nettoyer les cookies liés à l'authentification pour les deux domaines possibles
    const domains = ['.streamgenius.io', window.location.hostname];
    const paths = ['/', '/auth', '/login'];
    
    domains.forEach(domain => {
      paths.forEach(path => {
        document.cookie = `sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
        document.cookie = `sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
      });
    });
    
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
          window.location.hostname.includes('streamgenius.netlify.app'));
};
