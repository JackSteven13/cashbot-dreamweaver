
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Détecter l'environnement avec une méthode plus fiable
export const isProductionEnvironment = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('streamgenius.io') || 
          window.location.hostname.includes('netlify.app'));
};

// Fonction de log simplifiée
const log = (message: string, ...args: any[]) => {
  console.log(`[Supabase] ${message}`, ...args);
};

// Configuration Supabase avec typage explicite
const createSupabaseClient = (): SupabaseClient<Database> => {
  const isProduction = isProductionEnvironment();
  log(`Environnement détecté: ${isProduction ? "PRODUCTION" : "DÉVELOPPEMENT"}`);

  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Utiliser le même type pour tous les environnements pour éviter les problèmes
      flowType: 'pkce' as const,
      storage: localStorage,
      storageKey: 'sb-auth-token-' + (isProduction ? 'prod' : 'dev'),
    },
    global: {
      headers: {
        'Cache-Control': 'no-store',
        'X-Client-Info': 'streamgenius-web-' + (isProduction ? 'prod' : 'dev')
      }
    }
  };

  try {
    // Utiliser un typage explicite pour le client Supabase
    const client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, options);
    log("Client Supabase créé avec succès");
    return client;
  } catch (error) {
    // En cas d'erreur lors de la création du client, créer une version de secours
    console.error("Erreur lors de la création du client Supabase:", error);
    
    const fallbackOptions = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: localStorage
      }
    };
    
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, fallbackOptions);
  }
};

// Créer une instance du client
export const supabase = createSupabaseClient();

// Fonction de nettoyage complète pour les données d'authentification
export const clearStoredAuthData = () => {
  try {
    log("Nettoyage radical des données d'authentification");
    
    // Nettoyer localStorage - approche très agressive
    const keysToRemove = [
      // Clés Supabase
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token-prod',
      'sb-auth-token-dev',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      // Clés personnalisées
      'auth_checking',
      'auth_refreshing',
      'auth_redirecting',
      'auth_check_timestamp',
      'auth_redirect_timestamp',
      'auth_retries'
    ];
    
    // Supprimer les clés connues
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        // Ignorer les erreurs
      }
    });
    
    // Suppression encore plus agressive - analyser toutes les clés
    Object.keys(localStorage).forEach(key => {
      if (key.includes('sb-') || 
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('token')) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignorer les erreurs
        }
      }
    });
    
    // Nettoyer TOUS les cookies
    if (document.cookie) {
      const cookies = document.cookie.split(';');
      
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        // Supprimer avec différents domaines/paths
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        
        // Si en production, essayer avec domaine spécifique
        if (isProductionEnvironment()) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.streamgenius.io;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=streamgenius.io;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.netlify.app;`;
        }
      }
    }
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Fonction pour forcer une réinitialisation complète de l'authentification
export const forceRetrySigning = async () => {
  log("Réinitialisation complète de l'authentification");
  
  // Étape 1: Nettoyer toutes les données
  clearStoredAuthData();
  
  try {
    // Étape 2: Déconnexion explicite
    await supabase.auth.signOut({ scope: 'global' });
  } catch (e) {
    // Ignorer les erreurs
  }
  
  // Attendre un court délai
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Vider à nouveau le stockage par précaution
  clearStoredAuthData();
  
  // Étape 3: Vider le cache du navigateur pour les requêtes réseau
  try {
    if ('caches' in window) {
      // Tenter de vider le cache des requêtes faites à Supabase
      const caches = await window.caches.keys();
      for (const cache of caches) {
        if (cache.includes('supabase') || cache.includes('auth')) {
          await window.caches.delete(cache);
        }
      }
    }
  } catch (e) {
    // Ignorer les erreurs
  }
  
  return true;
};
