
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec URL et clé publique
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Client Supabase optimisé pour la fiabilité
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: fetch.bind(globalThis),
    headers: { 'Cache-Control': 'no-store' }
  },
  // Augmenter les délais d'attente pour une meilleure stabilité
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Fonction de nettoyage des données d'authentification
export const clearStoredAuthData = () => {
  try {
    if (typeof window === 'undefined') return;
    
    // Nettoyer localStorage
    const authKeys = [
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'sb-provider-token'
    ];
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Erreur lors de la suppression de ${key}:`, e);
      }
    });
    
    // Rechercher et supprimer toutes les clés liées à Supabase
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Erreur lors de la suppression de ${key}:`, e);
        }
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

// Fonction pour tester la disponibilité du service Supabase
export const testSupabaseConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Erreur lors du test de connexion à Supabase:", error);
    return false;
  }
};
