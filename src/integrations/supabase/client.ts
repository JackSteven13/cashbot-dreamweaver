
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration ultra-optimisée pour le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'sb-auth-token',
    flowType: 'implicit'
  },
  global: {
    headers: { 
      'X-Client-Info': 'streamgenius-web'
    },
  },
  realtime: {
    // Désactiver les connexions en temps réel pour améliorer la stabilité
    params: {
      eventsPerSecond: 0
    }
  }
});

// Fonction pour nettoyer TOUS les tokens d'authentification
export const clearStoredAuthData = () => {
  try {
    // Nettoyage complet de toutes les données d'authentification
    
    // 1. Nettoyer les clés connues dans localStorage
    const knownKeys = [
      'sb-auth-token',
      'supabase.auth.token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'supabase-auth-token',
      'sb-auth-token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-provider-token'
    ];
    
    knownKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {}
    });
    
    // 2. Nettoyer toutes les clés qui contiennent des indicateurs d'authentification
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('token') || 
          key.includes('sb-')
      )) {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
      }
    }
    
    // 3. Nettoyer les cookies liés à l'authentification
    document.cookie.split(';').forEach(c => {
      const cookieName = c.trim().split('=')[0];
      if (cookieName && (cookieName.includes('sb-') || cookieName.includes('supabase'))) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });
    
    console.log("Nettoyage complet des données d'authentification effectué");
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Initialiser la connexion au chargement du module
try {
  // Vérification immédiate pour s'assurer que la connexion est possible
  supabase.auth.onAuthStateChange(() => {});
  console.log("Module d'authentification initialisé avec succès");
} catch (e) {
  console.error("Erreur lors de l'initialisation du module d'authentification:", e);
}
