
import { createClient } from '@supabase/supabase-js';

// Utilisation de valeurs fixes pour une connexion stable
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration optimisée pour une meilleure persistance de session
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

// Fonction nettoyant toutes données d'authentification
export const clearStoredAuthData = () => {
  // Nettoyage local storage
  try {
    // Suppression ciblée des clés d'authentification Supabase
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('token')
        )) {
        keysToRemove.push(key);
      }
    }
    
    // Suppression de toutes les clés identifiées
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données:", err);
    return false;
  }
};
