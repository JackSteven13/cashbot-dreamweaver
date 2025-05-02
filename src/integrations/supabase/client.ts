
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Supprimer toutes les fonctions gestion du domaine qui créent des problèmes
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'implicit',
  },
});

// Fonctions utilitaires pour l'authentification
export const clearStoredAuthData = () => {
  try {
    // Nettoyer tous les jetons d'authentification
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
    
    // Supprimer toutes les métadonnées et flags d'authentification
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('auth_') || 
      key.startsWith('sb-') || 
      key.includes('supabase')
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log("Nettoyage complet des données d'authentification effectué");
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};
