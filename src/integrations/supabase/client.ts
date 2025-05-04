
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration simplifiée pour maximiser la compatibilité
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

// Fonction pour nettoyer les tokens d'authentification
export const clearStoredAuthData = () => {
  try {
    // Nettoyage ciblé des données d'authentification
    const authKeys = [
      'sb-auth-token',
      'supabase.auth.token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'supabase-auth-token'
    ];
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {}
    });
    
    console.log("Nettoyage des données d'authentification effectué");
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
