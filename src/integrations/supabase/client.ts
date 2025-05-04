
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Client supabase ultra-simplifié pour éviter les problèmes de connexion
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour nettoyer les données d'authentification
export const clearStoredAuthData = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données:", err);
    return false;
  }
};
