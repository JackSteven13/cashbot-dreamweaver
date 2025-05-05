
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Détecter l'environnement pour adapter les paramètres
const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('streamgenius.io');
console.log("Environnement détecté :", isProduction ? "PRODUCTION" : "DÉVELOPPEMENT");

// Configuration Supabase optimisée pour supporter production et développement
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Configuration adaptée en fonction de l'environnement
      flowType: isProduction ? 'pkce' : 'implicit',
      storage: localStorage,
      storageKey: 'sb-auth-token-' + (isProduction ? 'prod' : 'dev'),
      // Désactiver ces options problématiques en production
      ...(isProduction && {
        debug: true,
        cookieOptions: {
          name: 'sb-auth-token-prod',
          lifetime: 60 * 60 * 8, // 8 heures
          domain: 'streamgenius.io',
          sameSite: 'lax',
          secure: true
        }
      })
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': 'streamgenius-web-' + (isProduction ? 'prod' : 'dev')
      }
    }
  }
);

// Fonction de nettoyage complète pour les données d'authentification
// avec adaptation spécifique au domaine
export const clearStoredAuthData = () => {
  try {
    console.log("Nettoyage des données d'authentification");
    
    // Détecter si nous sommes en production
    const isProduction = typeof window !== 'undefined' && 
                        window.location.hostname.includes('streamgenius.io');
    
    // Nettoyer localStorage - approche exhaustive
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('token')) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Erreur lors de la suppression de ${key}:`, e);
        }
      }
    });
    
    // Supprimer explicitement les clés connues
    const knownKeys = [
      'supabase.auth.token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token-prod',
      'sb-auth-token-dev'
    ];
    
    knownKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.error(`Erreur lors de la suppression de la clé ${key}:`, e);
      }
    });
    
    // Nettoyer les cookies avec un ciblage explicite pour tous les domaines possibles
    document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Traitement spécifique pour le domaine streamgenius.io
    if (isProduction) {
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.streamgenius.io;';
      document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.streamgenius.io;';
      document.cookie = 'sb-auth-token-prod=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.streamgenius.io;';
    }
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Fonctions d'aide pour la gestion de l'authentification en production
export const isProductionEnvironment = () => {
  return typeof window !== 'undefined' && window.location.hostname.includes('streamgenius.io');
};

export const forceRetrySigning = async () => {
  // Nettoyer tous les jetons
  clearStoredAuthData();
  
  try {
    // Déconnexion explicite
    await supabase.auth.signOut({ scope: 'global' });
  } catch (e) {
    console.error("Erreur lors de la déconnexion forcée:", e);
  }
  
  // Attendre un court délai
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Vider à nouveau le stockage par précaution
  clearStoredAuthData();
  
  return true;
};

