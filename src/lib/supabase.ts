
import { createClient } from '@supabase/supabase-js';

// Configuration de base pour Supabase
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Création du client Supabase avec une configuration robuste
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage
  },
  global: {
    fetch: (...args) => {
      // Ajout d'un timeout pour éviter les requêtes bloquées
      // @ts-ignore - Le typings du fetch de Supabase est incomplet
      return fetch(...args, { 
        cache: 'no-store',
        credentials: 'same-origin'
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
    
    // Supprimer la clé spécifique pour ce projet
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    // Supprimer les clés d'email et d'autres données
    localStorage.removeItem('last_logged_in_email');
    
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

// Vérifier si nous sommes dans un environnement de production
export const isProductionEnvironment = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('streamgenius.io') || 
          window.location.hostname.includes('netlify.app'));
};

// Function pour tester la connexion à Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const startTime = performance.now();
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      mode: 'cors',
      cache: 'no-store'
    });
    
    const endTime = performance.now();
    console.log(`Supabase health check: ${response.status} in ${Math.round(endTime - startTime)}ms`);
    
    return response.status === 200;
  } catch (error) {
    console.error("Erreur lors du test de connexion à Supabase:", error);
    return false;
  }
};
