
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec des options de connexion robustes
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Client Supabase avec configuration améliorée pour plus de stabilité
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  global: {
    fetch: (url, options) => {
      // Add timeout to fetch requests to avoid hanging forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const modifiedOptions = {
        ...(options || {}),
        signal: controller.signal,
      };
      
      return fetch(url, modifiedOptions)
        .then(response => {
          clearTimeout(timeoutId);
          return response;
        })
        .catch(err => {
          clearTimeout(timeoutId);
          console.error("Erreur réseau Supabase:", err);
          throw new Error("Problème de connexion au serveur d'authentification");
        });
    }
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

// Fonctions améliorées pour vérifier la connectivité aux serveurs
export const pingSupabaseServer = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/auth/v1/health', {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      // Use cache: 'no-store' to avoid cached responses
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Impossible de contacter le serveur Supabase:", error);
    return false;
  }
};

// Fonction pour tester la connectivité avec un backup
export const testConnectivity = async (): Promise<boolean> => {
  try {
    // Essayer d'abord le serveur Supabase
    const isSupabaseReachable = await pingSupabaseServer();
    if (isSupabaseReachable) {
      return true;
    }
    
    // Si Supabase n'est pas joignable, essayer un autre domaine populaire
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      
      // Si Google est joignable mais pas Supabase, c'est un problème spécifique à Supabase
      if (response.ok) {
        console.log("Internet fonctionne mais Supabase est inaccessible");
        return false;
      }
    } catch (e) {
      // Si ni Supabase ni Google ne sont joignables, c'est probablement un problème de connexion internet
      console.log("Problème de connexion internet général");
      return false;
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors du test de connectivité:", error);
    return false;
  }
};
