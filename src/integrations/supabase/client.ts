
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec des options de connexion robustes
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Client Supabase avec configuration simplifiée pour plus de stabilité
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Fonction de nettoyage radical des données d'authentification
export const clearStoredAuthData = () => {
  try {
    console.log("Nettoyage des données d'authentification");
    
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

// Fonction simplifiée pour vérifier la connectivité au serveur Supabase
export const pingSupabaseServer = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/auth/v1/health', {
      method: 'HEAD',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      // Éviter le cache
      cache: 'no-store'
    });
    
    return response.ok;
  } catch (error) {
    console.error("Impossible de contacter le serveur Supabase:", error);
    return false;
  }
};

// Fonction simplifiée pour tester la connectivité internet
export const testConnectivity = async (): Promise<boolean> => {
  return navigator.onLine;
};
